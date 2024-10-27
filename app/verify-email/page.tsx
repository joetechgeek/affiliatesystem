"use client"

import { useState } from 'react'
import { supabase } from '../../utils/supabase'

export default function VerifyEmail() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    })

    if (error) {
      setMessage('Error resending verification email. Please try again.')
    } else {
      setMessage('Verification email resent. Please check your inbox.')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Verify Your Email</h1>
      <p className="mb-4">
        We&apos;ve sent a verification link to your email address.
      </p>
      <form onSubmit={handleResendVerification} className="mb-4">
        <input
          type="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 mb-4 border rounded"
        />
        <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Resend Verification Email
        </button>
      </form>
      {message && <p className="text-center text-green-600">{message}</p>}
    </div>
  )
}
