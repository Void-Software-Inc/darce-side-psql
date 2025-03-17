'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (!response.ok || !data.user) {
          router.replace('/login');
          return;
        }
        
        const userIsAdmin = data.user.roleId === 1 || data.user.role === 'admin';
        setIsAdmin(userIsAdmin);
        
        if (!userIsAdmin) {
          router.replace('/unauthorized');
          return;
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.replace('/login');
      }
    }
    
    checkAdmin();
  }, [router]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div>
          <div className="w-16 h-16 border-4 border-gray-800 border-t-gray-400 rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-gray-400">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
} 