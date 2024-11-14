import { createClient } from '@supabase/supabase-js';
import { Product } from '@/types/product';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function getProductsForAI(): Promise<Product[]> {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        category,
        stock,
        features,
        image_url,
        created_at,
        updated_at
      `)
      .order('category')
      .eq('is_active', true); // Only get active products

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    if (!products) {
      return [];
    }

    return products.map(product => ({
      ...product,
      features: Array.isArray(product.features) 
        ? product.features 
        : typeof product.features === 'string'
        ? JSON.parse(product.features)
        : []
    }));
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
} 