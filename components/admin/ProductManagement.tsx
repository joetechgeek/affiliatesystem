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

  async function handleSave(product: Product) {
    try {
      const { error } = await supabase
        .from('products')
        .upsert({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          image_url: product.image_url,
          alt_image: product.alt_image
        });

      if (error) throw error;
      
      setEditingProduct(null);
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  }

  if (loading) return <div>Loading products...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Product Management</h2>
        <button
          onClick={() => setEditingProduct({
            id: 0,
            name: '',
            description: '',
            price: 0,
            stock: 0,
            image_url: null,
            alt_image: null
          })}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Add New Product
        </button>
      </div>

      <div className="grid gap-4">
        {products.map(product => (
          <div key={product.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
            <div>
              <h3 className="font-bold">{product.name}</h3>
              <p className="text-gray-600">${product.price} - Stock: {product.stock}</p>
            </div>
            <button
              onClick={() => setEditingProduct(product)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
            >
              Edit
            </button>
          </div>
        ))}
      </div>

      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">
              {editingProduct.id === 0 ? 'Add New Product' : 'Edit Product'}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSave(editingProduct);
            }}>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Product Name"
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <textarea
                  placeholder="Description"
                  value={editingProduct.description || ''}
                  onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={editingProduct.price}
                  onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={editingProduct.stock}
                  onChange={e => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Image URL"
                  value={editingProduct.image_url || ''}
                  onChange={e => setEditingProduct({...editingProduct, image_url: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Alt Image Text"
                  value={editingProduct.alt_image || ''}
                  onChange={e => setEditingProduct({...editingProduct, alt_image: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
