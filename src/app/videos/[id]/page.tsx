'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { YouTubePlayer } from './components/YouTubePlayer';
import { VideoInfo } from './components/VideoInfo';
import { Comments } from './components/Comments';
import { LikesDialog } from './components/LikesDialog';

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
        <div className="p-6 bg-[#111] border-gray-800 rounded-lg">
          <p className="text-gray-400 text-center">{error || 'Video not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Video and Title */}
          <div className="lg:col-span-2 space-y-6">
            <YouTubePlayer playlistUrl={video.playlist_url} />
            
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
              <p className="text-gray-400 whitespace-pre-wrap mb-8">{video.description}</p>

              {/* Video Info for Mobile */}
              <div className="lg:hidden mb-8">
                <VideoInfo
                  author={video.author}
                  type={video.type}
                  number_of_videos={video.number_of_videos}
                  labels={video.labels}
                  created_by={video.created_by}
                  created_at={video.created_at}
                />
              </div>

              <Comments videoId={params.id as string} />
            </div>
          </div>

          {/* Sidebar - Video Information (Desktop only) */}
          <div className="hidden lg:block">
            <VideoInfo
              author={video.author}
              type={video.type}
              number_of_videos={video.number_of_videos}
              labels={video.labels}
              created_by={video.created_by}
              created_at={video.created_at}
            />
          </div>
        </div>
      </div>

      <LikesDialog
        open={showLikesDialog}
        onOpenChange={setShowLikesDialog}
        loadingLikes={loadingLikes}
        likeUsers={likeUsers}
      />
    </div>
  );
} 