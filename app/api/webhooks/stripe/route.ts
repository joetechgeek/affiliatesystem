import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09-30.acacia',
})

// Initialize Supabase with service role for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      try {
        // Parse the items from metadata
        const items = JSON.parse(session.metadata?.items || '[]');
        
        // 1. Insert order_items
        for (const item of items) {
          const { error: orderItemError } = await supabase
            .from('order_items')
            .insert({
              order_id: session.metadata?.order_id, // Make sure this is passed from the order creation
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.price
            });

          if (orderItemError) throw orderItemError;
        }

        // 2. Update coupons table if coupon was used
        if (session.metadata?.coupon_code) {
          const { error: couponError } = await supabase
            .from('coupons')
            .insert({
              code: session.metadata.coupon_code,
              used: true,
              used_by: session.client_reference_id, // This is the user_id
              used_at: new Date().toISOString(),
              user_id: session.metadata.issuer_id, // Make sure this is passed
              discount_amount: session.total_details?.amount_discount 
                ? (session.total_details.amount_discount / 100) 
                : 0.1
            });

          if (couponError) throw couponError;
        }

        return NextResponse.json({ success: true });
        
      } catch (error) {
        console.error('Error processing webhook:', error);
        return NextResponse.json(
          { error: 'Error processing webhook' },
          { status: 500 }
        );
      }
    }

    // Handle other event types if needed
    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json(
      { 
        error: { 
          message: err instanceof Error ? err.message : 'Webhook handler failed' 
        } 
      },
      { status: 400 }
    )
  }
} 