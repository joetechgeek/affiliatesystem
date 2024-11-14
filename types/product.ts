export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  features: string[];
  image_url?: string;
  alt_image?: string;
  created_at?: string;
  updated_at?: string;
}
