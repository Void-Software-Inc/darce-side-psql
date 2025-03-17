'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';

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
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        
        if (!response.ok) {
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
  
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div>
          <div className="w-16 h-16 border-4 border-gray-800 border-t-gray-400 rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-full max-w-lg px-4">
        <Card className="bg-[#1a1a1a] border border-[#2a2a2a] shadow-xl">
          <div className="p-8">
            <h1 className="text-2xl font-semibold mb-6 text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Welcome, {user?.username}!
            </h1>
            
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium mb-4 text-gray-200">Account Information</h2>
                <div className="space-y-4 bg-[#222222] rounded-lg p-4">
                  <div className="flex items-center">
                    <span className="text-sm font-medium w-24 text-gray-400">Username</span>
                    <span className="text-gray-200">{user?.username}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium w-24 text-gray-400">Email</span>
                    <span className="text-gray-200">{user?.email}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium w-24 text-gray-400">Role</span>
                    <span className="text-gray-200 capitalize">{user?.role}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 