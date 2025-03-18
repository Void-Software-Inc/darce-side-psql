'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';

export default function CreateUserPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          useDemoSalt: false
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create user');
      }
      
      if (data.success) {
        setFormData({
          username: '',
          email: '',
          password: '',
          role: 'user'
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
    }
    setLoading(false);
  };
  
  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center mt-12">
      <div className="w-full max-w-lg px-4">
        <Card className="bg-[#1a1a1a] border border-[#2a2a2a] shadow-xl">
          <div className="p-8">
            <h1 className="text-2xl font-semibold mb-6 text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Create New User
            </h1>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-200">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  required
                  className="mt-1 block w-full bg-[#222222] border border-[#2a2a2a] rounded-md shadow-sm py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-200">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="mt-1 block w-full bg-[#222222] border border-[#2a2a2a] rounded-md shadow-sm py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-200">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  className="mt-1 block w-full bg-[#222222] border border-[#2a2a2a] rounded-md shadow-sm py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-200">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  required
                  className="mt-1 block w-full bg-[#222222] border border-[#2a2a2a] rounded-md shadow-sm py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="user">Regular User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Creating User...' : 'Create User'}
                </button>
              </div>
            </form>
            
            {result && (
              <div className={`mt-6 p-4 rounded-md ${
                result.success 
                  ? 'bg-green-900/20 border border-green-900/30' 
                  : 'bg-red-900/20 border border-red-900/30'
              }`}>
                <p className={`text-sm ${
                  result.success ? 'text-green-200' : 'text-red-200'
                }`}>
                  {result.message}
                </p>
                
                {result.success && result.userId && (
                  <p className="text-sm text-green-200/70 mt-2">
                    User created successfully with ID: {result.userId}
                  </p>
                )}
                
                {!result.success && result.error && (
                  <p className="text-sm text-red-200/70 mt-2">
                    {result.error}
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
} 