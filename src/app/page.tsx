'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface User {
  id: number;
  username: string;
  email: string;
  role?: string;
}

interface Video {
  id: number;
  title: string;
  description: string;
  image_url: string;
  playlist_url: string;
  type: string;
  author: string;
  number_of_videos?: number;
  created_at: string;
  created_by: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);

          // If user is authenticated, fetch videos
          if (data.user) {
            const videosRes = await fetch('/api/videos/get');
            if (videosRes.ok) {
              const videosData = await videosRes.json();
              setVideos(videosData.videos);
            }
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-16 h-16 border-4 border-gray-800 border-t-gray-400 rounded-full animate-spin"></div>
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
          <Button 
            variant="outline" 
            className="bg-transparent border-gray-800 text-gray-400 hover:text-white hover:bg-[#111] transition-all duration-500 px-8"
            onClick={() => window.location.href = '/login'}
          >
            Enter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user.username}</h1>
          <p className="text-gray-400">Ready to level up your grappling game?</p>
        </div>

        {/* Videos Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Available Videos</h2>
          {videos.length === 0 ? (
            <Card className="p-6 bg-[#111] border-gray-800">
              <p className="text-gray-400 text-center">No videos available yet.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <Card key={video.id} className="bg-[#111] border-gray-800 overflow-hidden">
                  <div className="aspect-video relative">
                    <img 
                      src={video.image_url} 
                      alt={video.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{video.title}</h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{video.description}</p>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Author: {video.author}</span>
                        <span className="px-2 py-1 bg-[#222] rounded text-xs">{video.type}</span>
                      </div>
                      {video.number_of_videos && (
                        <div className="text-sm text-gray-500">
                          Number of videos: {video.number_of_videos}
                        </div>
                      )}
                      <div className="text-sm text-gray-500">
                        <span>Added by {video.created_by}</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(video.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => window.open(video.playlist_url, '_blank')}
                    >
                      Watch Video
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
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
