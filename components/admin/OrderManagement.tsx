'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Order {
  id: number;
  user_id: string;
  total_amount: number;
  discount_applied: number;
  coupon_code: string | null;
  issued_by: string | null;
  commission_paid: boolean;
  status: string;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
  order_items: {
    id: number;
    product_id: number;
    quantity: number;
    price: number;
    products: {
      name: string;
    };
  }[];
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  const loadOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            email
          ),
          order_items (
            id,
            product_id,
            quantity,
            price,
            products:product_id (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setOrders(data || []);
      setError(null);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  if (loading) return <div className="text-black">Loading orders...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4 text-black">Order Management</h2>
      <div className="grid gap-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white p-4 rounded-lg shadow">
            <div className="text-black">
              <h3 className="text-xl font-semibold">Order #{order.id}</h3>
              <p>Customer: {order.profiles?.first_name} {order.profiles?.last_name}</p>
              <p>Email: {order.profiles?.email}</p>
              <p>Total Amount: ${order.total_amount}</p>
              <p>Status: {order.status}</p>
              <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
              
              <div className="mt-2">
                <h4 className="font-semibold">Order Items:</h4>
                {order.order_items?.map((item) => (
                  <div key={item.id} className="ml-4">
                    <p>{item.products?.name} - Qty: {item.quantity} - ${item.price}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
