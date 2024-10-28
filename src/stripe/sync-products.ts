import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09-30.acacia'
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function syncProductsToStripe() {
  const { data: products, error } = await supabase
    .from('products')
    .select('*');

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  for (const product of products) {
    try {
      const stripeProduct = await stripe.products.search({
        query: `metadata['supabase_id']:'${product.id}'`,
      });

      // Convert price from numeric to cents for Stripe
      const priceInCents = Math.round(Number(product.price) * 100);

      if (stripeProduct.data.length > 0) {
        // Update existing product
        const updatedProduct = await stripe.products.update(stripeProduct.data[0].id, {
          name: product.name,
          description: product.description || undefined,
          images: product.image_url ? [product.image_url] : undefined,
          metadata: {
            supabase_id: product.id.toString(),
            stock: product.stock.toString(),
            alt_image: product.alt_image || ''
          }
        });

        // Update or create price
        const prices = await stripe.prices.list({
          product: updatedProduct.id,
          limit: 1,
          active: true
        });

        if (prices.data.length > 0) {
          // Deactivate old price
          await stripe.prices.update(prices.data[0].id, { active: false });
        }

        // Create new price
        await stripe.prices.create({
          product: updatedProduct.id,
          unit_amount: priceInCents,
          currency: 'usd' // Change this to your currency
        });

      } else {
        // Create new product with price
        const newProduct = await stripe.products.create({
          name: product.name,
          description: product.description || undefined,
          images: product.image_url ? [product.image_url] : undefined,
          metadata: {
            supabase_id: product.id.toString(),
            stock: product.stock.toString(),
            alt_image: product.alt_image || ''
          }
        });

        // Create initial price
        await stripe.prices.create({
          product: newProduct.id,
          unit_amount: priceInCents,
          currency: 'usd' // Change this to your currency
        });
      }
    } catch (error) {
      console.error(`Error syncing product ${product.id}:`, error);
    }
  }
}

export { syncProductsToStripe };
