"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useCartStore } from '../store/useCartStore'

export default function Navigation() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClientComponentClient()
  const itemCount = useCartStore((state) => state.itemCount())

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setIsLoggedIn(!!session)
      } catch (error) {
        console.error('Error checking user session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
      setIsLoading(false)
      router.refresh()
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth, router])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      setIsLoggedIn(false)
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleSignIn = () => {
    router.push(`/login?redirectTo=${encodeURIComponent(pathname)}`)
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <nav className="bg-gray-800 text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold hover:text-gray-300 transition-colors">
            Our Store
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/cart" className="flex items-center hover:text-gray-300 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Cart ({itemCount})
            </Link>
            {isLoggedIn ? (
              <>
                <Link href="/profile" className="hover:text-gray-300 transition-colors">
                  Profile
                </Link>
                <Link href="/orders" className="hover:text-gray-300 transition-colors">
                  Orders
                </Link>
                <button onClick={handleSignOut} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors">
                  Logout
                </button>
              </>
            ) : (
              <button onClick={handleSignIn} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors">
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
