import { NextResponse } from 'next/server'
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not set');
  throw new Error('STRIPE_SECRET_KEY is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-09-30.acacia', // Update to match your Stripe version
});

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('Received request body:', body);
    const { items, couponCode, discountAmount } = body

    if (!items || !Array.isArray(items)) {
      throw new Error('Invalid items data');
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item: {price_data: {product_data: {name: string}, unit_amount: number}, quantity: number}) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.price_data.product_data.name,
        },
        unit_amount: item.price_data.unit_amount,
      },
      quantity: item.quantity,
    }));

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/cart`,
    };

    // Apply discount if coupon is valid
    if (couponCode && discountAmount) {
      const coupon = await stripe.coupons.create({
        percent_off: discountAmount * 100, // Convert to percentage
        duration: 'once',
        name: `Discount (${couponCode})`,
      });

      sessionParams.discounts = [{ coupon: coupon.id }];
    }

    console.log('Creating Stripe session with params:', sessionParams);

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log('Stripe session created:', session.id);

    return NextResponse.json({ sessionUrl: session.url })
  } catch (err) {
    console.error('Error creating checkout session:', err)
    return NextResponse.json({ error: { message: err instanceof Error ? err.message : 'An unknown error occurred' } }, { status: 500 })
  }
}
