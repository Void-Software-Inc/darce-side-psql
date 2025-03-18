'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { TypeSelector } from './components/type-selector';

export default function CreateVideoPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    playlistUrl: '',
    type: '',
    author: '',
    numberOfVideos: '',
    labels: [] as string[],
    newLabel: '' // Temporary state for new label input
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
    if (name === 'numberOfVideos') {
      // Ensure numberOfVideos is a positive number or empty
      if (value === '' || (/^\d+$/.test(value) && parseInt(value) > 0)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, type: value }));
  };

  const handleAddLabel = () => {
    if (formData.newLabel.trim() && !formData.labels.includes(formData.newLabel.trim())) {
      setFormData(prev => ({
        ...prev,
        labels: [...prev.labels, prev.newLabel.trim()],
        newLabel: ''
      }));
    }
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.filter(label => label !== labelToRemove)
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    
    try {
      const submitData = {
        ...formData,
        numberOfVideos: formData.numberOfVideos ? parseInt(formData.numberOfVideos) : null
      };
      delete (submitData as any).newLabel; // Remove temporary label input field

      const response = await fetch('/api/admin/videos/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
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
          playlistUrl: '',
          type: '',
          author: '',
          numberOfVideos: '',
          labels: [],
          newLabel: ''
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
    <div className="bg-[#0a0a0a] flex items-center justify-center mt-12 mb-12">
      <div className="w-full max-w-4xl px-4">
        <Card className="bg-[#1a1a1a] border border-[#2a2a2a] shadow-xl">
          <div className="p-8">
            <h1 className="text-2xl font-semibold mb-6 text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Add New Video
            </h1>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title and Type in one row */}
              <div className="grid grid-cols-2 gap-4">
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
                  <label htmlFor="type" className="block text-sm font-medium text-gray-200">
                    Type
                  </label>
                  <div className="mt-1">
                    <TypeSelector
                      value={formData.type}
                      onChange={handleTypeChange}
                    />
                  </div>
                </div>
              </div>

              {/* Author and Number of Videos in one row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="author" className="block text-sm font-medium text-gray-200">
                    Author
                  </label>
                  <input
                    type="text"
                    id="author"
                    name="author"
                    required
                    className="mt-1 block w-full bg-[#222222] border border-[#2a2a2a] rounded-md shadow-sm py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700"
                    value={formData.author}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="numberOfVideos" className="block text-sm font-medium text-gray-200">
                    Number of Videos
                  </label>
                  <input
                    type="number"
                    id="numberOfVideos"
                    name="numberOfVideos"
                    min="1"
                    className="mt-1 block w-full bg-[#222222] border border-[#2a2a2a] rounded-md shadow-sm py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700"
                    value={formData.numberOfVideos}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Description takes full width */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-200">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={2}
                  className="mt-1 block w-full bg-[#222222] border border-[#2a2a2a] rounded-md shadow-sm py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              {/* Image URL and Playlist URL in one row */}
              <div className="grid grid-cols-2 gap-4">
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
              </div>

              {/* Labels section */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Labels
                </label>
                <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
                  {formData.labels.map((label, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-700 rounded-md text-sm text-gray-200 flex items-center"
                    >
                      {label}
                      <button
                        type="button"
                        onClick={() => handleRemoveLabel(label)}
                        className="ml-2 text-gray-400 hover:text-gray-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="newLabel"
                    name="newLabel"
                    placeholder="Add a label"
                    className="flex-1 bg-[#222222] border border-[#2a2a2a] rounded-md shadow-sm py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700"
                    value={formData.newLabel}
                    onChange={handleChange}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLabel())}
                  />
                  <button
                    type="button"
                    onClick={handleAddLabel}
                    className="px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-700"
                  >
                    Add
                  </button>
                </div>
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