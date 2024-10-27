export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  alt_image?: string;
  stock: number;
}
