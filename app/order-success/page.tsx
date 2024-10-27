"use client"

import { useEffect } from 'react'
import { useCartStore } from '../../store/useCartStore'
import Link from 'next/link'

export default function OrderSuccessPage() {
  const clearCart = useCartStore((state) => state.clearCart)

  useEffect(() => {
    clearCart()
  }, [clearCart])

  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Order Successful!</h1>
      <p className="mb-8">Thank you for your purchase. Your order has been received and is being processed.</p>
      <Link href="/" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
        Continue Shopping
      </Link>
    </div>
  )
}
