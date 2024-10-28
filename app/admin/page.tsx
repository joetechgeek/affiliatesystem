'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProductManagement from '../../components/admin/ProductManagement';
import OrderManagement from '../../components/admin/OrderManagement';
import UserManagement from '../../components/admin/UserManagement';
import Analytics from '../../components/admin/Analytics';

type AdminSection = 'products' | 'orders' | 'users' | 'analytics' | 'sync';

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<AdminSection>('products');
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.email !== 'joetechgeek@gmail.com') {
        router.push('/');
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, router]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      setMessage('');
      
      const response = await fetch('/api/admin/sync-products', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.status === 401) {
        setMessage('Unauthorized. Please log in again.');
        return;
      }

      if (response.status === 403) {
        setMessage('Access denied. Admin privileges required.');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Sync failed');
      }

      setMessage('Products successfully synced to Stripe!');
    } catch (err) {
      console.error('Sync error:', err);
      setMessage('Error syncing products. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  if (!isAuthorized) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen bg-gray-800 p-4">
          <h1 className="text-white text-xl font-bold mb-8">Admin Dashboard</h1>
          <nav className="space-y-2">
            {['products', 'orders', 'users', 'analytics', 'sync'].map((section) => (
              <button
                key={section}
                onClick={() => setActiveSection(section as AdminSection)}
                className={`w-full text-left px-4 py-2 rounded ${
                  activeSection === section
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {activeSection === 'products' && <ProductManagement />}
          {activeSection === 'orders' && <OrderManagement />}
          {activeSection === 'users' && <UserManagement />}
          {activeSection === 'analytics' && <Analytics />}
          {activeSection === 'sync' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl mb-4">Stripe Product Sync</h2>
              <button
                onClick={handleSync}
                disabled={syncing}
                className={`px-4 py-2 rounded ${
                  syncing 
                    ? 'bg-gray-400' 
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
              >
                {syncing ? 'Syncing...' : 'Sync Products to Stripe'}
              </button>
              
              {message && (
                <p className={`mt-4 ${
                  message.includes('Error') ? 'text-red-500' : 'text-green-500'
                }`}>
                  {message}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
