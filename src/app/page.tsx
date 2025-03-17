'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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
  labels?: string[];
  created_at: string;
  created_by: string;
}

function VideoGrid({ videos }: { videos: Video[] }) {
  const router = useRouter();

  if (videos.length === 0) {
    return (
      <Card className="p-6 bg-[#111] border-gray-800">
        <p className="text-gray-400 text-center">No videos available yet.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {videos.map((video) => (
        <Card 
          key={video.id} 
          className="bg-[#111] border-gray-800 overflow-hidden flex flex-col cursor-pointer hover:border-gray-600 transition-colors"
          onClick={() => router.push(`/videos/${video.id}`)}
        >
          <div className="relative aspect-square w-full bg-[#111]">
            <Image
              src={video.image_url} 
              alt={video.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
              className="object-contain"
              priority={false}
            />
          </div>
          <div className="p-3">
            <h3 className="text-lg font-semibold mb-1 text-white line-clamp-2">{video.title}</h3>
            <p className="text-xs text-gray-400">by {video.author}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [instructionals, setInstructionals] = useState<Video[]>([]);
  const [matches, setMatches] = useState<Video[]>([]);
  const [tournaments, setTournaments] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);

          // If user is authenticated, fetch videos by type
          if (data.user) {
            const [instructionalsRes, matchesRes, tournamentsRes] = await Promise.all([
              fetch('/api/videos/instructionals/get'),
              fetch('/api/videos/matches/get'),
              fetch('/api/videos/tournaments/get')
            ]);

            if (instructionalsRes.ok) {
              const data = await instructionalsRes.json();
              setInstructionals(data.videos);
            }

            if (matchesRes.ok) {
              const data = await matchesRes.json();
              setMatches(data.videos);
            }

            if (tournamentsRes.ok) {
              const data = await tournamentsRes.json();
              setTournaments(data.videos);
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

        {/* Instructionals Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Available Instructionals</h2>
          <VideoGrid videos={instructionals} />
        </div>

        {/* Matches Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Available Matches</h2>
          <VideoGrid videos={matches} />
        </div>

        {/* Tournaments Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Available Tournaments</h2>
          <VideoGrid videos={tournaments} />
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
