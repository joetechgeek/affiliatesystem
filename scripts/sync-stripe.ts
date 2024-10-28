import { syncProductsToStripe } from '../src/stripe/sync-products';

async function main() {
  console.log('Starting product sync...');
  await syncProductsToStripe();
  console.log('Product sync completed!');
}

main().catch(console.error);
