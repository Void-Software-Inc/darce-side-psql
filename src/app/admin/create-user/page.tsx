'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateUserPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
    useDemoSalt: true,
    customSalt: ''
  });
  
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    userId?: number;
    error?: string;
  } | null>(null);
  
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    
    try {
      // Send the data to the API endpoint
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          useDemoSalt: formData.useDemoSalt,
          customSalt: formData.customSalt || undefined
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create user');
      }
      
      // Reset form on success
      if (data.success) {
        setFormData({
          username: '',
          email: '',
          password: '',
          role: 'user',
          useDemoSalt: true,
          customSalt: ''
        });
      }
      
      setResult({
        success: data.success,
        message: data.message,
        userId: data.userId
      });
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Create New User</h1>
            <Link href="/admin" className="text-indigo-600 hover:text-indigo-800">
              Back to Admin
            </Link>
          </div>
          
          <p className="mb-6 text-gray-600">
            This tool allows you to create new users directly in the database.
            Only administrators can create new users.
          </p>
          
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="text-md font-medium text-yellow-800 mb-2">Important Note</h3>
            <p className="text-sm text-yellow-700">
              The demo users (admin/user123) use hardcoded password checks for backward compatibility.
              New users created with demo-salt will work with the normal hash comparison.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="role"
                name="role"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="user">Regular User</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            
            <div className="pt-2">
              <div className="flex items-center">
                <input
                  id="useDemoSalt"
                  name="useDemoSalt"
                  type="checkbox"
                  checked={formData.useDemoSalt}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="useDemoSalt" className="ml-2 block text-sm text-gray-700">
                  Use demo-salt (for backward compatibility)
                </label>
              </div>
            </div>
            
            {!formData.useDemoSalt && (
              <div>
                <label htmlFor="customSalt" className="block text-sm font-medium text-gray-700">
                  Custom Salt (leave empty for random salt)
                </label>
                <input
                  type="text"
                  id="customSalt"
                  name="customSalt"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.customSalt}
                  onChange={handleChange}
                  placeholder="Enter custom salt or leave empty for random"
                />
              </div>
            )}
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
              >
                {loading ? 'Creating User...' : 'Create User'}
              </button>
            </div>
          </form>
          
          {result && (
            <div className={`mt-6 p-4 rounded-md ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <h2 className="text-lg font-medium mb-2">{result.message}</h2>
              
              {result.success && result.userId && (
                <div className="mt-4">
                  <p className="text-green-700">
                    User created successfully with ID: {result.userId}
                  </p>
                </div>
              )}
              
              {!result.success && result.error && (
                <div className="mt-4">
                  <h3 className="text-md font-medium mb-2">Error Details:</h3>
                  <p className="text-red-700">{result.error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 