'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import React from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  role?: string;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
        // Only redirect to login if trying to access protected routes
        if (pathname !== '/' && pathname !== '/login') {
          router.push('/login');
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      if (res.ok) {
        setUser(null);
        // Force a full page refresh to reset all state
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isAdmin = user?.role === 'admin';
  const isHomePage = pathname === '/';
  const isLoginPage = pathname === '/login';

  // Generate breadcrumbs based on pathname
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    
    return (
      <Breadcrumb className="text-gray-400">
        <BreadcrumbList>
          <BreadcrumbItem>
            {isHomePage ? (
              <BreadcrumbPage className="text-xl font-bold tracking-tighter text-gray-400">
                DARCE SIDE
              </BreadcrumbPage>
            ) : (
              <BreadcrumbLink href="/" className="text-xl font-bold tracking-tighter hover:text-white transition-colors">
                DARCE SIDE
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
          
          {paths.map((path, index) => {
            const href = `/${paths.slice(0, index + 1).join('/')}`;
            const isLast = index === paths.length - 1;
            const displayText = path.charAt(0).toUpperCase() + path.slice(1);

            return (
              <React.Fragment key={href}>
                <BreadcrumbSeparator className="text-gray-600" />
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="text-gray-400 text-xl tracking-tighter font-bold uppercase">{displayText}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={href} className="text-gray-400 text-xl tracking-tighter font-bold uppercase hover:text-white transition-colors">{displayText}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    );
  };

  // Don't show anything while checking auth
  if (loading) return null;

  // Don't show navbar on login page or when logged out
  if (isLoginPage || !user) return null;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-gray-800">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {generateBreadcrumbs()}
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link href="/admin">
                <Button 
                  variant="ghost" 
                  className="text-gray-400 hover:text-gray-300 hover:bg-[#111] transition-all duration-300 cursor-pointer"
                >
                  Dashboard
                </Button>
              </Link>
            )}
            <Button 
              variant="ghost" 
              className="text-gray-400 hover:text-gray-300 hover:bg-[#111] transition-all duration-300 cursor-pointer"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </nav>
      {/* Spacer to prevent content from going under fixed navbar */}
      <div className="h-16" />
    </>
  );
} 