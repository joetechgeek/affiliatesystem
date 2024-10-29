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
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')!

  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      
      // Get session details with line items
      const checkoutSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items'],
      })

      // Start database transaction
      const { data: orderData, error: orderError } = await supabase.rpc(
        'handle_successful_order',
        {
          p_session_id: session.id,
          p_payment_intent_id: session.payment_intent as string,
          p_total_amount: session.amount_total! / 100,
          p_user_id: session.client_reference_id,
          p_coupon_code: session.metadata?.coupon_code,
          p_discount_amount: session.total_details?.amount_discount ? session.total_details.amount_discount / 100 : 0
        }
      )

      if (orderError) {
        throw new Error(`Error processing order: ${orderError.message}`)
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json(
      { error: { message: 'Webhook handler failed' } },
      { status: 400 }
    )
  }
} 