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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const supabase = createClientComponentClient();

  const loadOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles (first_name, last_name, email),
          order_items (
            id,
            product_id,
            quantity,
            price,
            products (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function updateOrderStatus(orderId: number, status: string) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
      loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  }

  if (loading) return <div>Loading orders...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Order Management</h2>

      <div className="grid gap-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold">Order #{order.id}</h3>
                <p className="text-gray-600">
                  {order.profiles?.first_name} {order.profiles?.last_name}
                </p>
                <p className="text-gray-600">{order.profiles?.email}</p>
                <p className="text-gray-600">
                  Total: ${order.total_amount} - Status: 
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    className="ml-2 border rounded p-1"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(order)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold mb-4">Order Details #{selectedOrder.id}</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-bold">Items:</h4>
                {selectedOrder.order_items.map(item => (
                  <div key={item.id} className="flex justify-between py-2 border-b">
                    <span>{item.products.name} x {item.quantity}</span>
                    <span>${item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <p><strong>Subtotal:</strong> ${selectedOrder.total_amount}</p>
                {selectedOrder.discount_applied > 0 && (
                  <p><strong>Discount:</strong> ${selectedOrder.discount_applied}</p>
                )}
                {selectedOrder.coupon_code && (
                  <p><strong>Coupon:</strong> {selectedOrder.coupon_code}</p>
                )}
                <p><strong>Status:</strong> {selectedOrder.status}</p>
                <p><strong>Created:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
