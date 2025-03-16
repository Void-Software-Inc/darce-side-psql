'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Fetch users from the API
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users');
        
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            // If not authenticated or not authorized, redirect to login
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch users');
        }
        
        const data = await response.json();
        setUsers(data.users || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [router]);
  
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center">
              <Link href="/dashboard" className="mr-4 px-3 py-2 rounded-md text-sm font-medium text-indigo-600 hover:text-indigo-900">
                Dashboard
              </Link>
              <button
                onClick={() => router.push('/api/auth/logout')}
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
              Admin Panel
            </h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-xl font-semibold">User Management</h2>
                <Link
                  href="/admin/create-user"
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Create New User
                </Link>
              </div>
              
              {loading ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">Loading users...</p>
                </div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {users.length > 0 ? (
                      users.map((user) => (
                        <li key={user.id}>
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-900">{user.username}</p>
                                  <p className="text-sm text-gray-500">{user.email}</p>
                                </div>
                              </div>
                              <div>
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {user.role}
                                </span>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                        No users found
                      </li>
                    )}
                  </ul>
                </div>
              )}
              
              <div className="mt-8 p-6 bg-white shadow rounded-lg">
                <h2 className="text-xl font-semibold mb-4">How to Create Users Manually</h2>
                <p className="mb-4">
                  To create users manually, you have two options:
                </p>
                
                <ol className="list-decimal pl-5 space-y-2 mb-4">
                  <li>
                    <strong>Use the Create User Tool:</strong> Click the "Create New User" button above to generate SQL that you can run in pgAdmin.
                  </li>
                  <li>
                    <strong>Run the Command Line Script:</strong> Use the script to generate a password hash:
                    <pre className="bg-gray-100 p-2 mt-2 rounded">npx ts-node src/scripts/generate-user-hash.ts your_password</pre>
                  </li>
                </ol>
                
                <p>
                  After generating the SQL, run it in pgAdmin to create the user in your database.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 