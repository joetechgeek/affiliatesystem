import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getProductsForAI() {
  const { data: products } = await supabase
    .from('products')
    .select(`
      id,
      name,
      description,
      price,
      category,
      stock,
      features
    `)
    .order('category');
  
  return products?.map(product => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    category: product.category,
    stock: product.stock,
    features: product.features
  })) || [];
} 