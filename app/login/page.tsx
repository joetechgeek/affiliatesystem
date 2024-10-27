"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const redirectTo = searchParams?.get('redirectTo') || '/'
        router.push(redirectTo)
      }
    }
    checkUser()
  }, [router, searchParams, supabase.auth])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      const redirectTo = searchParams?.get('redirectTo') || '/'
      router.push(redirectTo)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <form onSubmit={handleLogin} className="mb-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 mb-4 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-2 mb-4 border rounded"
        />
        <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Log In
        </button>
      </form>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      <p className="text-center">
        Don&apos;t have an account? <Link href="/signup">Sign up</Link>
      </p>
    </div>
  )
}
