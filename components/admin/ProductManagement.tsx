'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  alt_image: string | null;
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const supabase = createClientComponentClient();

  const loadProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  if (loading) return <div className="text-black">Loading products...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4 text-black">Product Management</h2>
      <div className="grid gap-4">
        {products.map((product) => (
          <div key={product.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-black">
                  {product.name}
                </h3>
                <p className="text-black">
                  {product.description}
                </p>
                <p className="text-black">
                  Price: ${product.price}
                </p>
                <p className="text-black">
                  Stock: {product.stock}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingProduct(product)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Add edit form modal/component here if needed */}
    </div>
  );
}
