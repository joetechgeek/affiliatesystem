"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../utils/supabase'

export default function SignUp() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  const generateCouponCode = async (firstName: string, lastName: string) => {
    let code = (firstName.slice(0, 2) + lastName.slice(0, 2)).toUpperCase()
    let unique = false
    while (!unique) {
      const randomNum = Math.floor(Math.random() * 100)
      const fullCode = `${code}${randomNum.toString().padStart(2, '0')}`
      const { data } = await supabase
        .from('profiles')
        .select('coupon_code')
        .eq('coupon_code', fullCode)
      if (data && data.length === 0) {
        unique = true
        code = fullCode
      }
    }
    return code
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    const couponCode = await generateCouponCode(firstName, lastName)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          coupon_code: couponCode
        }
      }
    })

    if (authError) {
      console.error('Error signing up:', authError)
      setMessage('Error signing up. Please try again.')
      return
    }

    if (authData.user) {
      setMessage('Sign up successful! Please check your email to verify your account. If you don\'t see the email, please check your spam folder.')
      router.push('/verify-email')
    } else {
      setMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <form onSubmit={handleSignUp} className="mb-4">
        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          className="w-full p-2 mb-4 border rounded"
        />
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          className="w-full p-2 mb-4 border rounded"
        />
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
        <input
          type="tel"
          placeholder="Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />
        <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Sign Up
        </button>
      </form>
      {message && <p className="text-center text-green-600">{message}</p>}
    </div>
  )
}
