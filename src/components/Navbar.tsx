'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
import { Menu, X } from 'lucide-react';

interface User {
  id: number;
  username: string;
  email: string;
  role?: string;
}

const trimTitle = (title: string, maxLength: number = 12) => {
  if (title.length <= maxLength) return title;
  const start = title.slice(0, Math.ceil(maxLength / 2));
  const end = title.slice(title.length - Math.floor(maxLength / 2));
  return `${start}...${end}`;
};

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
        if (pathname !== '/' && pathname !== '/login' && pathname !== '/register') {
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
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isAdmin = user?.role === 'admin';
  const isHomePage = pathname === '/';
  const isLoginPage = pathname === '/login';
  const isRegisterPage = pathname === '/register';

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
          
          {/* Only show the last path on mobile */}
          {paths.map((path, index) => {
            const href = `/${paths.slice(0, index + 1).join('/')}`;
            const isLast = index === paths.length - 1;
            let displayText = path.charAt(0).toUpperCase() + path.slice(1);

            // If this is a video ID and we have the title in URL state, use it
            if (paths[0] === 'videos' && index === 1) {
              const videoTitle = searchParams.get('title');
              if (videoTitle) {
                displayText = videoTitle;
              }
            }

            // Trim long titles
            displayText = trimTitle(displayText);

            // On mobile, only show if it's the last item
            if (isLast) {
              return (
                <React.Fragment key={href}>
                  <BreadcrumbSeparator className="text-gray-600" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-gray-400 text-xl tracking-tighter font-bold uppercase">
                      {displayText}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </React.Fragment>
              );
            }

            // On desktop, show all items
            return (
              <React.Fragment key={href}>
                <BreadcrumbSeparator className="text-gray-600 hidden sm:block" />
                <BreadcrumbItem className="hidden sm:block">
                  <BreadcrumbLink 
                    href={href} 
                    className="text-gray-400 text-xl tracking-tighter font-bold uppercase hover:text-white transition-colors"
                  >
                    {displayText}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    );
  };

  if (loading) return null;
  if (isLoginPage || isRegisterPage || !user) return null;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-gray-800">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            {generateBreadcrumbs()}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-4">
            <Link href="/videos">
              <Button 
                variant="ghost" 
                className="text-gray-400 hover:text-gray-300 hover:bg-[#111] transition-all duration-300 cursor-pointer"
              >
                Videos
              </Button>
            </Link>
            <Link href="/requests">
              <Button 
                variant="ghost" 
                className="text-gray-400 hover:text-gray-300 hover:bg-[#111] transition-all duration-300 cursor-pointer"
              >
                Requests
              </Button>
            </Link>
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
            <Link href={`/users/${user?.username}`}>
              <Button 
                variant="ghost" 
                className="text-gray-400 hover:text-gray-300 hover:bg-[#111] transition-all duration-300 cursor-pointer"
              >
                Profile
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              className="text-gray-400 hover:text-gray-300 hover:bg-[#111] transition-all duration-300 cursor-pointer"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden bg-[#111] border-t border-gray-800">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
              <Link href="/videos" className="w-full">
                <Button 
                  variant="ghost" 
                  className="w-full text-left text-gray-400 hover:text-gray-300 hover:bg-[#222] transition-all duration-300 h-12"
                >
                  Videos
                </Button>
              </Link>
              <Link href="/requests" className="w-full">
                <Button 
                  variant="ghost" 
                  className="w-full text-left text-gray-400 hover:text-gray-300 hover:bg-[#222] transition-all duration-300 h-12"
                >
                  Requests
                </Button>
              </Link>
              {isAdmin && (
                <Link href="/admin" className="w-full">
                  <Button 
                    variant="ghost" 
                    className="w-full text-left text-gray-400 hover:text-gray-300 hover:bg-[#222] transition-all duration-300 h-12"
                  >
                    Dashboard
                  </Button>
                </Link>
              )}
              <Link href={`/users/${user?.username}`} className="w-full">
                <Button 
                  variant="ghost" 
                  className="w-full text-left text-gray-400 hover:text-gray-300 hover:bg-[#222] transition-all duration-300 h-12"
                >
                  Profile
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                className="w-full text-left text-gray-400 hover:text-gray-300 hover:bg-[#222] transition-all duration-300 h-12"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        )}
      </nav>
      {/* Spacer to prevent content from going under fixed navbar */}
      <div className={`h-16 ${isMenuOpen ? (isAdmin ? 'md:h-16 h-[192px]' : 'md:h-16 h-[144px]') : 'h-16'}`} />
    </>
  );
} 