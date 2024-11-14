import ProductList from '../components/ProductList'
import { supabase } from '../utils/supabase'

export default async function Home() {
  const { data: products } = await supabase.from('products').select('*')

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Welcome to JoeTechStore</h1>
      <ProductList products={products || []} />
    </div>
  )
}
