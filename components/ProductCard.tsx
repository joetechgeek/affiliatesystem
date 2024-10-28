"use client"

import Image from 'next/image'
import Link from 'next/link'
import { Product } from '../types/product'
import { useState } from 'react'

type ProductCardProps = {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <Link href={`/product/${product.id}`} className="block h-full">
      <div className="border rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow h-full flex flex-col">
        <div className="relative w-full pt-[100%] mb-4">
          {product.image_url && !imageError ? (
            <Image
              src={product.image_url}
              alt={product.alt_image || product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover rounded absolute top-0 left-0"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute top-0 left-0 w-full h-full bg-gray-200 flex items-center justify-center rounded">
              <span className="text-gray-500">No image available</span>
            </div>
          )}
        </div>
        <div className="flex-grow flex flex-col">
          <h2 className="text-xl font-semibold mb-2 line-clamp-2">{product.name}</h2>
          <p className="text-gray-600 mb-2 flex-grow line-clamp-2">{product.description}</p>
          <div className="mt-auto">
            <p className="text-lg font-bold mb-4">${product.price.toFixed(2)}</p>
            <div className="flex justify-start">
              <span className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
                View Details
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
