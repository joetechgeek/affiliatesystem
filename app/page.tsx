"use client"

import { useEffect, useState } from 'react'
import { Product } from '../types/product'
import ProductList from '../components/ProductList'
import { supabase } from '../utils/supabase'

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
      
      if (error) {
        console.error('Error fetching products:', error)
      } else {
        setProducts(data || [])
      }
      setIsLoading(false)
    }

    fetchProducts()
  }, [])

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Welcome to Our Store</h1>
      <ProductList products={products} />
    </div>
  )
}
