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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
} 