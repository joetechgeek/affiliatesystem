"use client"

import Image from 'next/image'
import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { supabase } from '../../../utils/supabase'
import { Product } from '../../../types/product'
import { useCartStore } from '../../../store/useCartStore'
import { useEffect, useState } from 'react'
import Notification from '../../../components/Notification'

export default function ProductPage() {
  const params = useParams() as { id: string }
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((state) => state.addItem)
  const [notification, setNotification] = useState<string | null>(null)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  useEffect(() => {
    async function fetchProduct() {
      if (!params?.id) return

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('Error fetching product:', error)
        notFound()
      } else {
        setProduct(data)
      }
    }

    fetchProduct()
  }, [params?.id])

  if (!product) {
    return <div>Loading...</div>
  }

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity)
      setNotification(`Added ${quantity} of ${product.name} to cart`)
      setIsAddingToCart(true)
      setTimeout(() => {
        setIsAddingToCart(false)
        setNotification(null)
      }, 2000)
    }
  }

  const incrementQuantity = () => {
    setQuantity(prev => Math.min(prev + 1, product.stock))
  }

  const decrementQuantity = () => {
    setQuantity(prev => Math.max(prev - 1, 1))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {notification && <Notification message={notification} />}
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/2 relative h-[400px]">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.alt_image || product.name}
              fill
              className="object-cover rounded"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded">
              <span className="text-gray-500">No image available</span>
            </div>
          )}
        </div>
        <div className="md:w-1/2">
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <p className="text-gray-600 mb-4">{product.description}</p>
          <p className="text-2xl font-bold mb-4">${product.price.toFixed(2)}</p>
          <div className="flex items-center mb-4">
            <span className="mr-2">Quantity:</span>
            <button onClick={decrementQuantity} className="px-2 py-1 bg-gray-200 rounded-l">-</button>
            <span className="px-4 py-1 bg-gray-100">{quantity}</span>
            <button onClick={incrementQuantity} className="px-2 py-1 bg-gray-200 rounded-r">+</button>
          </div>
          <button 
            onClick={handleAddToCart}
            className={`px-6 py-3 rounded-lg transition-colors ${
              isAddingToCart 
                ? 'bg-green-500 text-white' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isAddingToCart ? 'Added to Cart' : 'Add to Cart'}
          </button>
        </div>
      </div>
      <div className="mt-8">
        <Link href="/" className="text-blue-500 hover:underline">
          ← Continue Shopping
        </Link>
      </div>
    </div>
  )
}
