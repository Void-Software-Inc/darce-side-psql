'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useParams } from 'next/navigation';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from 'next/navigation';

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

interface LikeUser {
  username: string;
  created_at: string;
}

function getYouTubePlaylistId(url: string): string | null {
  const regex = /[?&]list=([^#\&\?]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function YouTubePlaylist({ playlistUrl }: { playlistUrl: string }) {
  const playlistId = getYouTubePlaylistId(playlistUrl);
  
  if (!playlistId) return null;

  return (
    <div className="aspect-video w-full">
      <iframe
        src={`https://www.youtube.com/embed/videoseries?list=${playlistId}`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full rounded-lg"
      />
    </div>
  );
}

export default function VideoPage() {
  const params = useParams();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showLikesDialog, setShowLikesDialog] = useState(false);
  const [likeUsers, setLikeUsers] = useState<LikeUser[]>([]);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchVideo() {
      try {
        const response = await fetch(`/api/videos/${params.id}`);
        if (!response.ok) {
          throw new Error('Video not found');
        }
        const data = await response.json();
        setVideo(data.video);
        setLikesCount(data.video.likes_count);

        // Check if user has liked this video
        const likeResponse = await fetch(`/api/videos/likes/get?videoId=${params.id}`);
        if (likeResponse.ok) {
          const likeData = await likeResponse.json();
          setIsLiked(likeData.hasLiked);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load video');
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchVideo();
    }
  }, [params.id]);

  const handleLike = async () => {
    try {
      const res = await fetch('/api/videos/likes/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId: params.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsLiked(data.action === 'added');
        setLikesCount(data.likesCount);
      }
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  const fetchLikeUsers = async () => {
    setLoadingLikes(true);
    try {
      const res = await fetch(`/api/videos/likes/users?videoId=${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setLikeUsers(data.users);
      } else {
        toast.error('Failed to fetch likes');
      }
    } catch (error) {
      toast.error('Failed to fetch likes');
    } finally {
      setLoadingLikes(false);
    }
  };

  const handleShowLikes = async () => {
    setShowLikesDialog(true);
    fetchLikeUsers();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-800 border-t-gray-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="p-6 bg-[#111] border-gray-800">
          <p className="text-gray-400 text-center">{error || 'Video not found'}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Video and Title */}
          <div className="lg:col-span-2 space-y-6">
            <YouTubePlaylist playlistUrl={video.playlist_url} />
            
            <div>
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-3xl font-bold">{video.title}</h1>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLike}
                    className="flex items-center text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Heart
                      className={`h-6 w-6 ${isLiked ? 'fill-red-500 text-red-500' : ''}`}
                    />
                  </button>
                  <button
                    onClick={handleShowLikes}
                    className="text-lg text-gray-400 hover:text-white transition-colors"
                  >
                    {likesCount}
                  </button>
                </div>
              </div>
              <p className="text-gray-400 whitespace-pre-wrap">{video.description}</p>
            </div>
          </div>

          {/* Sidebar - Video Information */}
          <div className="space-y-6">
            <Card className="bg-[#111] border-gray-800 p-6">
              <h2 className="text-xl font-semibold mb-4 text-white">Video Information</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm text-gray-400 mb-1">Author</h3>
                  <p className="text-white">{video.author}</p>
                </div>

                <div>
                  <h3 className="text-sm text-gray-400 mb-1">Type</h3>
                  <Badge variant="outline" className="bg-[#222] text-white border-gray-700">
                    {video.type}
                  </Badge>
                </div>

                {video.number_of_videos && (
                  <div>
                    <h3 className="text-sm text-gray-400 mb-1">Number of Videos</h3>
                    <p className="text-white">{video.number_of_videos}</p>
                  </div>
                )}

                {video.labels && video.labels.length > 0 && (
                  <div>
                    <h3 className="text-sm text-gray-400 mb-1">Labels</h3>
                    <div className="flex flex-wrap gap-2">
                      {video.labels.map((label, index) => (
                        <Badge 
                          key={index}
                          variant="outline" 
                          className="bg-[#222] text-white border-gray-700"
                        >
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm text-gray-400 mb-1">Added By</h3>
                  <p className="text-white">{video.created_by}</p>
                </div>

                <div>
                  <h3 className="text-sm text-gray-400 mb-1">Added On</h3>
                  <p className="text-white">
                    {new Date(video.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showLikesDialog} onOpenChange={setShowLikesDialog}>
        <DialogContent className="bg-[#111] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Liked by</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {loadingLikes ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-gray-800 border-t-gray-400 rounded-full animate-spin"></div>
              </div>
            ) : likeUsers.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No likes yet</p>
            ) : (
              <div className="space-y-3">
                {likeUsers.map((user, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <button
                      onClick={() => router.push(`/users/${user.username}`)}
                      className="text-white hover:underline transition-all duration-300"
                    >
                      {user.username}
                    </button>
                    <span className="text-sm text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 