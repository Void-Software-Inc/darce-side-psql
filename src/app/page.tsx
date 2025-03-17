'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  username: string;
  email: string;
  role?: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      if (res.ok) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-xl text-white">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tighter">
            DARCE SIDE
          </h1>
          <p className="text-sm text-gray-500 mb-12 tracking-widest uppercase">
            By Invitation Only
          </p>
          <Link href="/login">
            <Button 
              variant="outline" 
              className="bg-transparent border-gray-800 text-gray-400 hover:text-white hover:bg-[#111] transition-all duration-500 px-8"
            >
              Enter
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-800">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tighter hover:text-gray-300 transition-colors">
            DARCE SIDE
          </Link>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link href="/admin">
                <Button variant="ghost" className="text-gray-400 hover:text-white">
                  Dashboard
                </Button>
              </Link>
            )}
            <Button 
              variant="ghost" 
              className="text-gray-400 hover:text-white"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user.username}</h1>
          <p className="text-gray-400">Ready to level up your grappling game?</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="p-6 bg-[#111] border-gray-800">
            <h2 className="text-xl font-bold mb-4">Latest Instructionals</h2>
            <div className="space-y-4">
              <div className="p-4 bg-[#222] rounded-lg">
                <h3 className="font-medium">Darce Choke Mastery</h3>
                <p className="text-sm text-gray-400">Updated 2 days ago</p>
              </div>
              <div className="p-4 bg-[#222] rounded-lg">
                <h3 className="font-medium">Leg Lock System</h3>
                <p className="text-sm text-gray-400">Updated 5 days ago</p>
              </div>
            </div>
            <Button className="w-full mt-4">View All Instructionals</Button>
          </Card>

          <Card className="p-6 bg-[#111] border-gray-800">
            <h2 className="text-xl font-bold mb-4">Your Progress</h2>
            <div className="space-y-4">
              <div className="p-4 bg-[#222] rounded-lg">
                <h3 className="font-medium">Recently Viewed</h3>
                <p className="text-sm text-gray-400">Back Attack System - Part 3</p>
              </div>
              <div className="p-4 bg-[#222] rounded-lg">
                <h3 className="font-medium">Bookmarked</h3>
                <p className="text-sm text-gray-400">5 techniques saved</p>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4">View Progress</Button>
          </Card>
        </div>

        {/* Featured Content */}
        <Card className="p-6 bg-[#111] border-gray-800 mb-8">
          <h2 className="text-xl font-bold mb-4">Featured This Week</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#222] rounded-lg">
              <h3 className="font-medium">Guard Retention</h3>
              <p className="text-sm text-gray-400">New series available</p>
            </div>
            <div className="p-4 bg-[#222] rounded-lg">
              <h3 className="font-medium">Competition Prep</h3>
              <p className="text-sm text-gray-400">Training strategies</p>
            </div>
            <div className="p-4 bg-[#222] rounded-lg">
              <h3 className="font-medium">Advanced Concepts</h3>
              <p className="text-sm text-gray-400">Theory and application</p>
            </div>
          </div>
        </Card>

        {/* Community Section */}
        <Card className="p-6 bg-[#111] border-gray-800">
          <h2 className="text-xl font-bold mb-4">Community Highlights</h2>
          <p className="text-gray-400 mb-4">
            Connect with fellow grapplers and share your journey
          </p>
          <Button variant="outline">Join Discussion</Button>
        </Card>
      </div>
    </div>
  );
}
