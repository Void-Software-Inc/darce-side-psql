'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

function NotFoundContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const from = searchParams.get('from');

  return (
    <div className="fixed inset-0 bg-black text-white flex items-center justify-center">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-4xl font-bold">404</h1>
        <h2 className="text-xl text-gray-400">Page Not Found</h2>
        <p className="text-gray-500">
          {from ? `The page "${from}" could not be found.` : "The page you're looking for doesn't exist."}
        </p>
        <Button
          onClick={() => router.push('/')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Go Home
        </Button>
      </div>
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-6 p-8">
          <h1 className="text-4xl font-bold">404</h1>
          <h2 className="text-xl text-gray-400">Page Not Found</h2>
        </div>
      </div>
    }>
      <NotFoundContent />
    </Suspense>
  );
} 