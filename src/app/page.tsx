'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { VideoCarousel } from '@/components/VideoCarousel';

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
  comments_count: number;
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
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center">
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
        {instructionals.length > 0 && (
          <VideoCarousel
            title="Instructionals"
            videos={instructionals}
            type="instructionals"
          />
        )}

        {/* Matches Section */}
        {matches.length > 0 && (
          <VideoCarousel
            title="Matches"
            videos={matches}
            type="matches"
          />
        )}

        {/* Tournaments Section */}
        {tournaments.length > 0 && (
          <VideoCarousel
            title="Tournaments"
            videos={tournaments}
            type="tournaments"
          />
        )}
      </div>
    </div>
  );
}
