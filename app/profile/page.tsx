"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../utils/supabase'

type Profile = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone_number: string
  coupon_code: string
}

export default function Profile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
        } else {
          setProfile(data)
        }
      } else {
        router.push('/login')
      }
    }

    fetchProfile()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfile(prev => prev ? { ...prev, [name]: value } : null)
  }

  const handleSave = async () => {
    if (profile) {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          phone_number: profile.phone_number
        })
        .eq('id', profile.id)

      if (error) {
        console.error('Error updating profile:', error)
      } else {
        setIsEditing(false)
      }
    }
  }

  const copyToClipboard = () => {
    if (profile) {
      navigator.clipboard.writeText(profile.coupon_code)
      alert('Coupon code copied to clipboard!')
    }
  }

  if (!profile) return <div>Loading...</div>

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>
      <div className="w-full max-w-md">
        {isEditing ? (
          <>
            <input
              type="text"
              name="first_name"
              value={profile.first_name}
              onChange={handleInputChange}
              className="w-full p-2 mb-4 border rounded"
            />
            <input
              type="text"
              name="last_name"
              value={profile.last_name}
              onChange={handleInputChange}
              className="w-full p-2 mb-4 border rounded"
            />
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleInputChange}
              className="w-full p-2 mb-4 border rounded"
            />
            <input
              type="tel"
              name="phone_number"
              value={profile.phone_number || ''}
              onChange={handleInputChange}
              placeholder="Phone Number"
              className="w-full p-2 mb-4 border rounded"
            />
          </>
        ) : (
          <>
            <p className="mb-2">Name: {profile.first_name} {profile.last_name}</p>
            <p className="mb-2">Email: {profile.email}</p>
            <p className="mb-2">Phone: {profile.phone_number || 'Not provided'}</p>
          </>
        )}
        <div className="flex items-center mb-4">
          <p className="mr-2">Coupon Code: {profile.coupon_code}</p>
          <button
            onClick={copyToClipboard}
            className="bg-gray-200 p-2 rounded hover:bg-gray-300"
          >
            📋
          </button>
        </div>
        {isEditing ? (
          <button
            onClick={handleSave}
            className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600 mb-4"
          >
            Save Changes
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
          >
            Edit Profile
          </button>
        )}
        <button
          onClick={handleLogout}
          className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Log Out
        </button>
      </div>
    </div>
  )
}
