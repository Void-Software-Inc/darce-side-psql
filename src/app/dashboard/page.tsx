'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  permissions: string[];
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Fetch the current user
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        
        if (!response.ok) {
          // If not authenticated, redirect to login
          router.push('/login');
          return;
        }
        
        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [router]);
  
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      // Fallback to direct navigation if the request fails
      router.push('/api/auth/logout');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center">
              {user?.role === 'admin' && (
                <Link href="/admin" className="mr-4 px-3 py-2 rounded-md text-sm font-medium text-indigo-600 hover:text-indigo-900">
                  Admin Panel
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:text-red-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              Welcome, {user?.username}!
            </h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              <div className="border-4 border-dashed border-gray-200 rounded-lg p-6 bg-white">
                <h2 className="text-xl font-semibold mb-4">Your Account Information</h2>
                <div className="space-y-2">
                  <p><strong>Username:</strong> {user?.username}</p>
                  <p><strong>Email:</strong> {user?.email}</p>
                  <p><strong>Role:</strong> {user?.role}</p>
                  <div>
                    <p><strong>Permissions:</strong></p>
                    <ul className="list-disc list-inside ml-4">
                      {user?.permissions.map((permission, index) => (
                        <li key={index}>{permission}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 