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

      // Get full session details with line items
      const checkoutSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items']
      })

      // Parse metadata
      const items = checkoutSession.metadata?.items 
        ? JSON.parse(checkoutSession.metadata.items)
        : []

      // Step 1: Create order and handle coupon/commission
      const { data: orderResult, error: orderError } = await supabase.rpc(
        'handle_successful_order',
        {
          p_session_id: session.id,
          p_payment_intent_id: session.payment_intent as string,
          p_total_amount: session.amount_total! / 100,
          p_user_id: session.client_reference_id,
          p_coupon_code: session.metadata?.coupon_code,
          p_discount_amount: session.total_details?.amount_discount 
            ? session.total_details.amount_discount / 100 
            : 0
        }
      )

      if (orderError) {
        console.error('Error processing order:', orderError)
        throw new Error(`Error processing order: ${orderError.message}`)
      }

      // Step 2: Handle order items and update stock
      const { error: itemsError } = await supabase.rpc(
        'handle_order_items',
        {
          p_order_id: orderResult.order_id,
          p_items: JSON.stringify(items)
        }
      )

      if (itemsError) {
        console.error('Error processing order items:', itemsError)
        throw new Error(`Error processing order items: ${itemsError.message}`)
      }

      // Log successful processing
      console.log(`Successfully processed order ${orderResult.order_id} for session ${session.id}`)

      return NextResponse.json({
        success: true,
        orderId: orderResult.order_id
      })
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