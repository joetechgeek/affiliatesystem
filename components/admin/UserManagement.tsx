'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  coupon_code: string;
  orders: {
    id: number;
    total_amount: number;
    created_at: string;
  }[];
}

export default function UserManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const supabase = createClientComponentClient();

  const loadProfiles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          orders (
            id,
            total_amount,
            created_at
          )
        `)
        .order('first_name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  if (loading) return <div>Loading users...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">User Management</h2>

      <div className="grid gap-4">
        {profiles.map(profile => (
          <div key={profile.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold">
                  {profile.first_name} {profile.last_name}
                </h3>
                <p className="text-gray-600">{profile.email}</p>
                <p className="text-gray-600">
                  Orders: {profile.orders?.length || 0}
                </p>
              </div>
              <button
                onClick={() => setSelectedProfile(profile)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold mb-4">User Details</h3>
            <div className="space-y-4">
              <div>
                <p><strong>Name:</strong> {selectedProfile.first_name} {selectedProfile.last_name}</p>
                <p><strong>Email:</strong> {selectedProfile.email}</p>
                <p><strong>Phone:</strong> {selectedProfile.phone_number || 'Not provided'}</p>
                <p><strong>Coupon Code:</strong> {selectedProfile.coupon_code}</p>
              </div>
              <div>
                <h4 className="font-bold">Order History:</h4>
                {selectedProfile.orders?.map(order => (
                  <div key={order.id} className="flex justify-between py-2 border-b">
                    <span>Order #{order.id}</span>
                    <span>${order.total_amount}</span>
                    <span>{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
