'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';

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
  likes_count: number;
}

function VideoGrid({ videos }: { videos: Video[] }) {
  const router = useRouter();
  const [likedVideos, setLikedVideos] = useState<Record<number, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    // Initialize like counts from videos
    const initialLikeCounts = videos.reduce((acc, video) => {
      acc[video.id] = video.likes_count;
      return acc;
    }, {} as Record<number, number>);
    setLikeCounts(initialLikeCounts);

    // Check which videos are liked by the current user
    videos.forEach(async (video) => {
      try {
        const res = await fetch(`/api/videos/likes/get?videoId=${video.id}`);
        if (res.ok) {
          const data = await res.json();
          setLikedVideos(prev => ({
            ...prev,
            [video.id]: data.hasLiked
          }));
        }
      } catch (error) {
        console.error('Error checking video like:', error);
      }
    });
  }, [videos]);

  const handleLike = async (e: React.MouseEvent, videoId: number) => {
    e.stopPropagation(); // Prevent navigation when clicking the like button
    
    try {
      const res = await fetch('/api/videos/likes/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId }),
      });

      if (res.ok) {
        const data = await res.json();
        setLikedVideos(prev => ({
          ...prev,
          [videoId]: data.action === 'added'
        }));
        setLikeCounts(prev => ({
          ...prev,
          [videoId]: data.likesCount
        }));
      }
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

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
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">by {video.author}</p>
              <button
                onClick={(e) => handleLike(e, video.id)}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-500 transition-colors"
              >
                <Heart
                  className={`h-4 w-4 ${
                    likedVideos[video.id] ? 'fill-red-500 text-red-500' : 'fill-none'
                  }`}
                />
                <span>{likeCounts[video.id] || 0}</span>
              </button>
            </div>
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
      </div>
    </div>
  );
}
