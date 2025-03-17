'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';

export default function CreateVideoPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    playlistUrl: ''
  });
  
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    videoId?: number;
    error?: string;
  } | null>(null);
  
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/admin/videos/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create video');
      }
      
      if (data.success) {
        setFormData({
          title: '',
          description: '',
          imageUrl: '',
          playlistUrl: ''
        });
      }
      
      setResult({
        success: data.success,
        message: data.message,
        videoId: data.videoId
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
    <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-full max-w-lg px-4">
        <Card className="bg-[#1a1a1a] border border-[#2a2a2a] shadow-xl">
          <div className="p-8">
            <h1 className="text-2xl font-semibold mb-6 text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Add New Video
            </h1>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-200">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  className="mt-1 block w-full bg-[#222222] border border-[#2a2a2a] rounded-md shadow-sm py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700"
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-200">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="mt-1 block w-full bg-[#222222] border border-[#2a2a2a] rounded-md shadow-sm py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-200">
                  Image URL
                </label>
                <input
                  type="url"
                  id="imageUrl"
                  name="imageUrl"
                  required
                  className="mt-1 block w-full bg-[#222222] border border-[#2a2a2a] rounded-md shadow-sm py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700"
                  value={formData.imageUrl}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label htmlFor="playlistUrl" className="block text-sm font-medium text-gray-200">
                  Playlist URL
                </label>
                <input
                  type="url"
                  id="playlistUrl"
                  name="playlistUrl"
                  required
                  className="mt-1 block w-full bg-[#222222] border border-[#2a2a2a] rounded-md shadow-sm py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700"
                  value={formData.playlistUrl}
                  onChange={handleChange}
                />
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Creating Video...' : 'Create Video'}
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
                
                {result.success && result.videoId && (
                  <p className="text-sm text-green-200/70 mt-2">
                    Video created successfully with ID: {result.videoId}
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