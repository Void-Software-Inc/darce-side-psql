'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import { CalendarDays, Heart, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import UpvoteButton from '@/app/requests/components/UpvoteButton';

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
  team: string;
  recommendations_count: number;
  recommendations: Recommendation[];
}

interface Recommendation {
  id: number;
  title: string;
  description: string;
  status: string;
  upvotes_count: number;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likedVideos, setLikedVideos] = useState<{ [key: number]: boolean }>({});
  const [likeCounts, setLikeCounts] = useState<{ [key: number]: number }>({});
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [teamValue, setTeamValue] = useState('');

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const response = await fetch(`/api/users/${params.username}/get`);
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

  const handleTeamEdit = async () => {
    if (!isEditingTeam) {
      setTeamValue(profile?.team || '');
      setIsEditingTeam(true);
      return;
    }

    try {
      const response = await fetch(`/api/users/${profile?.username}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ team: teamValue }),
      });

      if (!response.ok) {
        throw new Error('Failed to update team');
      }

      const data = await response.json();
      setProfile(prev => prev ? { ...prev, team: teamValue } : null);
      setIsEditingTeam(false);
      toast.success('Team updated successfully');
    } catch (error) {
      toast.error('Failed to update team');
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
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-4 text-white flex items-center gap-2 flex-wrap">
                {profile.username}
                {profile.is_current_user && (
                  <span className="text-base md:text-lg text-gray-400">(you)</span>
                )}
              </h1>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-gray-400 mb-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{profile.likes_given} likes given</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{profile.comments_count} comments</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 flex-shrink-0">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                  </svg>
                  <span className="text-sm">{profile.recommendations_count} requests</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <span className="text-gray-400 text-sm">Team:</span>
                {isEditingTeam && profile.is_current_user ? (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Input
                      value={teamValue}
                      onChange={(e) => setTeamValue(e.target.value)}
                      className="bg-[#222222] border-[#2a2a2a] text-white h-8 w-full sm:w-48"
                      placeholder="Enter team name"
                    />
                    <Button
                      onClick={handleTeamEdit}
                      className="h-8 px-3 bg-black hover:bg-[#222222] text-white border border-[#2a2a2a] whitespace-nowrap"
                    >
                      Save
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-white text-sm">{profile.team || 'No team'}</span>
                    {profile.is_current_user && (
                      <Button
                        onClick={handleTeamEdit}
                        className="h-8 px-3 bg-black hover:bg-[#222222] text-white border border-[#2a2a2a]"
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Liked Videos Section */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-6">Liked Videos</h2>
          {profile.liked_videos.length === 0 ? (
            <Card className="p-6 bg-[#111] border-gray-800">
              <p className="text-gray-400 text-center text-sm">No liked videos yet</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      className="object-contain"
                      priority={false}
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="text-base md:text-lg font-semibold mb-1 text-white line-clamp-2">
                      {trimTitle(video.title)}
                    </h3>
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

        {/* Recommendations Section */}
        <div className="mt-8">
          <h2 className="text-xl md:text-2xl font-bold mb-6">Requests by {profile.username}</h2>
          {profile.recommendations.length === 0 ? (
            <Card className="p-6 bg-[#111] border-gray-800">
              <p className="text-gray-400 text-center text-sm">No requests yet</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {profile.recommendations.map((recommendation) => (
                <Card 
                  key={recommendation.id} 
                  className="bg-[#111] border-gray-800 p-4"
                >
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold text-white">{recommendation.title}</h3>
                    <p className="text-sm text-gray-400">{recommendation.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        recommendation.status === 'pending' ? 'bg-yellow-900/50 text-yellow-500' :
                        recommendation.status === 'resolved' ? 'bg-green-900/50 text-green-500' :
                        'bg-red-900/50 text-red-500'
                      }`}>
                        {recommendation.status.charAt(0).toUpperCase() + recommendation.status.slice(1)}
                      </span>
                      <UpvoteButton
                        recommendationId={recommendation.id}
                        initialUpvotesCount={recommendation.upvotes_count}
                        disabled={recommendation.status !== 'pending'}
                      />
                    </div>
                    {recommendation.admin_response && (
                      <div className="mt-2 p-3 bg-gray-900/50 rounded-md">
                        <p className="text-sm text-gray-300">{recommendation.admin_response}</p>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Created {new Date(recommendation.created_at).toLocaleDateString()}
                    </p>
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