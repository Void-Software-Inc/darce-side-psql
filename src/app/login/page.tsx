'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const username = formData.get('identifier') as string;
    const password = formData.get('password') as string;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to login');
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black px-4 py-8 sm:px-6">
      <Card className="w-full max-w-md mx-auto bg-[#111] shadow-xl">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">Login</h1>
            <p className="text-sm text-gray-400">
              Enter your details below to login to your account
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-3">
              <Label htmlFor="identifier" className="text-white text-sm">Email or Username</Label>
              <Input
                id="identifier"
                name="identifier"
                type="text"
                placeholder="m@example.com"
                required
                className="bg-[#222] border-gray-800 text-white h-12 px-4 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-white text-sm">Password</Label>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="bg-[#222] border-gray-800 text-white h-12 px-4 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="text-sm text-red-500 py-2">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium transition-colors"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
          <Button
              className="w-full h-12 text-base font-medium transition-colors"
              disabled={isLoading}
              >
                <Link href="/register">Register with Access Code</Link>
            </Button>
        </div>
      </Card>
    </div>
  );
} 