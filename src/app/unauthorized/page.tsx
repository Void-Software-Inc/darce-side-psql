'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">
          Access Denied
        </h1>
        
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="text-6xl mb-4">🚫</div>
          
          <p className="text-gray-600 text-lg mb-6">
            Sorry, you don't have permission to access this page. This area is restricted to administrators only.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => router.back()}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded hover:bg-gray-200 transition-colors"
            >
              Go Back
            </button>
            
            <Link
              href="/dashboard"
              className="block w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition-colors"
            >
              Return to Dashboard
            </Link>
            
            <div className="text-sm text-gray-500 mt-4">
              If you believe this is a mistake, please contact your system administrator.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 