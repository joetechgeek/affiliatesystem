// Product types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url?: string;
  alt_image?: string;
}

// Message types for AI
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Analytics types
export interface SalesData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
}

export interface TopProduct {
  product_id: number;
  name: string;
  total_quantity: number;
  total_revenue: number;
} 