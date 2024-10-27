import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function useAuth(redirectTo?: string) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session && redirectTo) {
        router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`)
      }
      setIsLoading(false)
    }
    checkUser()
  }, [supabase, router, redirectTo])

  const signOut = async () => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setIsLoading(false)
      router.refresh()
    }
  }

  return { signOut, isLoading }
}
