'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import { CalendarDays, Heart, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

// Function to trim titles to match "Higher Tripod Passing" length (20 characters)
const trimTitle = (title: string, maxLength: number = 21) => {
  if (title.length <= maxLength) return title;
  return title.slice(0, maxLength - 3) + "...";
};

interface Video {
  id: number;
  title: string;
  description: string;
  image_url: string;
  type: string;
  author: string;
  created_at: string;
  created_by: string;
  liked_at: string;
  likes_count: number;
  comments_count: number;
}

interface UserProfile {
  username: string;
  created_at: string;
  likes_given: number;
  comments_count: number;
  liked_videos: Video[];
  is_current_user: boolean;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likedVideos, setLikedVideos] = useState<{ [key: number]: boolean }>({});
  const [likeCounts, setLikeCounts] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const response = await fetch(`/api/users/${params.username}`);
        if (!response.ok) {
          throw new Error('User not found');
        }
        const data = await response.json();
        setProfile(data.user);
        
        // Initialize like counts
        const counts: { [key: number]: number } = {};
        data.user.liked_videos.forEach((video: Video) => {
          counts[video.id] = video.likes_count;
        });
        setLikeCounts(counts);

        // Check which videos are liked by the current user
        const likePromises = data.user.liked_videos.map((video: Video) =>
          fetch(`/api/videos/likes/get?videoId=${video.id}`)
            .then(res => res.json())
            .then(data => ({ videoId: video.id, hasLiked: data.hasLiked }))
        );

        const likeResults = await Promise.all(likePromises);
        const likedState: { [key: number]: boolean } = {};
        likeResults.forEach(result => {
          likedState[result.videoId] = result.hasLiked;
        });
        setLikedVideos(likedState);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user profile');
      } finally {
        setLoading(false);
      }
    }

    if (params.username) {
      fetchUserProfile();
    }
  }, [params.username]);

  const handleLike = async (videoId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent navigation when clicking the like button
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-800 border-t-gray-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="p-6 bg-[#111] border-gray-800">
          <p className="text-gray-400 text-center">{error || 'User not found'}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="container mx-auto px-4">
        {/* User Info Section */}
        <Card className="bg-[#111] border-gray-800 p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-white">
                {profile.username}
                {profile.is_current_user && (
                  <span className="ml-2 text-gray-400 text-lg">(you)</span>
                )}
              </h1>
              <div className="flex items-center gap-6 text-gray-400">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  <span>{profile.likes_given} likes given</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>{profile.comments_count} comments</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Liked Videos Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Liked Videos</h2>
          {profile.liked_videos.length === 0 ? (
            <Card className="p-6 bg-[#111] border-gray-800">
              <p className="text-gray-400 text-center">No liked videos yet</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {profile.liked_videos.map((video) => (
                <Card 
                  key={video.id} 
                  className="bg-[#111] border-gray-800 overflow-hidden flex flex-col cursor-pointer hover:border-gray-600 transition-colors"
                  onClick={() => router.push(`/videos/${video.id}?title=${encodeURIComponent(video.title)}`)}
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
                    <h3 className="text-lg font-semibold mb-1 text-white line-clamp-2">{trimTitle(video.title)}</h3>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">by {video.author}</p>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-sm text-gray-400">
                          <MessageSquare className="h-4 w-4" />
                          {video.comments_count || 0}
                        </span>
                        <button
                          onClick={(e) => handleLike(video.id, e)}
                          className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
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
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 