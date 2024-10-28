'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface SalesData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
}

interface TopProduct {
  name: string;
  total_sold: number;
  revenue: number;
}

interface CommissionData {
  total_commissions: number;
  paid_commissions: number;
  unpaid_commissions: number;
}

interface SupabaseOrderItem {
  quantity: number;
  price: number;
  products: {
    name: string;
  };
}

export default function Analytics() {
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [commissionData, setCommissionData] = useState<CommissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  const loadAnalytics = useCallback(async () => {
    try {
      // Fetch sales data
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total_amount, user_id');
      
      if (ordersError) throw ordersError;

      // Calculate sales metrics
      const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const totalOrders = orders?.length || 0;
      const uniqueCustomers = new Set(orders?.map(order => order.user_id)).size;
      const averageOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

      setSalesData({
        totalRevenue,
        totalOrders,
        totalCustomers: uniqueCustomers,
        averageOrderValue
      });

      // Fetch top products with proper typing
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          quantity,
          price,
          products:products (
            name
          )
        `);

      if (itemsError) throw itemsError;

      // Safely type the orderItems and handle the data
      const typedOrderItems = (orderItems as unknown as SupabaseOrderItem[])?.map(item => ({
        quantity: item.quantity,
        price: item.price,
        products: {
          name: item.products.name
        }
      }));

      // Calculate product metrics with properly typed data
      const productStats = (typedOrderItems || []).reduce((acc: Record<string, TopProduct>, item) => {
        const productName = item.products.name;
        if (!acc[productName]) {
          acc[productName] = {
            name: productName,
            total_sold: 0,
            revenue: 0
          };
        }
        acc[productName].total_sold += item.quantity;
        acc[productName].revenue += item.price * item.quantity;
        return acc;
      }, {});

      setTopProducts(Object.values(productStats)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5));

      // Fetch commission data
      const { data: commissions, error: commissionsError } = await supabase
        .from('commissions')
        .select('commission_amount, paid');

      if (commissionsError) throw commissionsError;

      const totalCommissions = commissions?.reduce((sum, comm) => sum + comm.commission_amount, 0) || 0;
      const paidCommissions = commissions?.reduce((sum, comm) => 
        comm.paid ? sum + comm.commission_amount : sum, 0) || 0;

      setCommissionData({
        total_commissions: totalCommissions,
        paid_commissions: paidCommissions,
        unpaid_commissions: totalCommissions - paidCommissions
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) return <div>Loading analytics...</div>;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Analytics Dashboard</h2>

      {/* Sales Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500">Total Revenue</h3>
          <p className="text-2xl font-bold">${salesData?.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500">Total Orders</h3>
          <p className="text-2xl font-bold">{salesData?.totalOrders}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500">Total Customers</h3>
          <p className="text-2xl font-bold">{salesData?.totalCustomers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500">Average Order Value</h3>
          <p className="text-2xl font-bold">${salesData?.averageOrderValue.toFixed(2)}</p>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">Top Products</h3>
        <div className="space-y-4">
          {topProducts.map(product => (
            <div key={product.name} className="flex justify-between items-center border-b pb-2">
              <div>
                <p className="font-semibold">{product.name}</p>
                <p className="text-sm text-gray-500">Sold: {product.total_sold}</p>
              </div>
              <p className="font-bold">${product.revenue.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Commission Overview */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">Commission Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="text-gray-500">Total Commissions</h4>
            <p className="text-2xl font-bold">${commissionData?.total_commissions.toFixed(2)}</p>
          </div>
          <div>
            <h4 className="text-gray-500">Paid Commissions</h4>
            <p className="text-2xl font-bold text-green-500">
              ${commissionData?.paid_commissions.toFixed(2)}
            </p>
          </div>
          <div>
            <h4 className="text-gray-500">Unpaid Commissions</h4>
            <p className="text-2xl font-bold text-yellow-500">
              ${commissionData?.unpaid_commissions.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
