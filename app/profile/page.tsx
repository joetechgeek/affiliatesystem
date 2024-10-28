"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type Profile = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone_number: string | null
  coupon_code: string
}

// Simple copy icon as an SVG component
const CopyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
)

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<Profile | null>(null)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login?redirectTo=/profile')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
      } else {
        setProfile(data)
        setEditedProfile(data)
      }
      setIsLoading(false)
    }

    fetchProfile()
  }, [router, supabase])

  const handleSave = async () => {
    if (!editedProfile) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editedProfile.first_name,
          last_name: editedProfile.last_name,
          phone_number: editedProfile.phone_number
        })
        .eq('id', editedProfile.id)

      if (error) throw error

      setProfile(editedProfile)
      setIsEditing(false)
      setMessage('Profile updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage('Error updating profile. Please try again.')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setMessage('Coupon code copied to clipboard!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
      setMessage('Failed to copy coupon code')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!profile) {
    return <div>Error loading profile</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        {isEditing ? (
          // Edit Mode
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">First Name</label>
              <input
                type="text"
                value={editedProfile?.first_name || ''}
                onChange={(e) => setEditedProfile(prev => prev ? {...prev, first_name: e.target.value} : null)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Last Name</label>
              <input
                type="text"
                value={editedProfile?.last_name || ''}
                onChange={(e) => setEditedProfile(prev => prev ? {...prev, last_name: e.target.value} : null)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Phone Number</label>
              <input
                type="tel"
                value={editedProfile?.phone_number || ''}
                onChange={(e) => setEditedProfile(prev => prev ? {...prev, phone_number: e.target.value} : null)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setEditedProfile(profile)
                  setIsEditing(false)
                }}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          // View Mode
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
              <p>{profile.first_name} {profile.last_name}</p>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
              <p>{profile.email}</p>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Phone Number</label>
              <p>{profile.phone_number || 'Not provided'}</p>
            </div>
            <div className="py-2">
              <label className="block text-gray-700 text-sm font-bold mb-3">Your Coupon Code</label>
              <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
                <p className="text-lg font-semibold tracking-wide">{profile.coupon_code}</p>
                <button
                  onClick={() => copyToClipboard(profile.coupon_code)}
                  className="text-blue-500 hover:text-blue-700"
                  title="Copy to clipboard"
                >
                  <CopyIcon />
                </button>
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Edit Profile
              </button>
              <button
                onClick={() => router.push('/reset-password')}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Change Password
              </button>
            </div>
          </div>
        )}
        {message && (
          <div className={`mt-4 p-2 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}
