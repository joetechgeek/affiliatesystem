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
  product_id: number;
  name: string;
  total_quantity: number;
  total_revenue: number;
}

interface ProductData {
  product_id: number;
  quantity: number;
  price: number;
  products: {
    name: string;
  };
}

export default function Analytics() {
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  const loadAnalytics = useCallback(async () => {
    try {
      // Fetch basic sales metrics
      const { data: salesMetrics, error: salesError } = await supabase
        .from('orders')
        .select('total_amount, user_id');

      if (salesError) throw salesError;

      // Calculate basic metrics
      const totalRevenue = salesMetrics?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const totalOrders = salesMetrics?.length || 0;
      const uniqueCustomers = new Set(salesMetrics?.map(order => order.user_id)).size;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      setSalesData({
        totalRevenue,
        totalOrders,
        totalCustomers: uniqueCustomers,
        averageOrderValue,
      });

      // Fetch top products with type annotation
      const { data: productData, error: productError } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          price,
          products:product_id (
            name
          )
        `) as { data: ProductData[], error: any };

      if (productError) throw productError;

      // Process top products data with proper typing
      const productStats = productData.reduce((acc: { [key: number]: TopProduct }, item) => {
        if (!acc[item.product_id]) {
          acc[item.product_id] = {
            product_id: item.product_id,
            name: item.products.name || 'Unknown Product',
            total_quantity: 0,
            total_revenue: 0,
          };
        }
        acc[item.product_id].total_quantity += item.quantity;
        acc[item.product_id].total_revenue += item.price * item.quantity;
        return acc;
      }, {});

      // Convert to array and sort by revenue
      const topProductsArray = Object.values(productStats)
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 5); // Get top 5 products

      setTopProducts(topProductsArray);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) return <div className="text-black">Loading analytics...</div>;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-black">Analytics Dashboard</h2>

      {/* Sales Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500">Total Revenue</h3>
          <p className="text-2xl font-bold text-black">${salesData?.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500">Total Orders</h3>
          <p className="text-2xl font-bold text-black">{salesData?.totalOrders}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500">Total Customers</h3>
          <p className="text-2xl font-bold text-black">{salesData?.totalCustomers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500">Average Order Value</h3>
          <p className="text-2xl font-bold text-black">${salesData?.averageOrderValue.toFixed(2)}</p>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4 text-black">Top Products</h3>
        <div className="space-y-4">
          {topProducts.map((product) => (
            <div key={product.product_id} className="flex justify-between items-center border-b pb-2">
              <div className="text-black">
                <p className="font-semibold">{product.name}</p>
                <p className="text-sm text-gray-500">Quantity Sold: {product.total_quantity}</p>
              </div>
              <p className="text-black font-semibold">
                ${product.total_revenue.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
