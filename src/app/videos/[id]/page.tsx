'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useParams } from 'next/navigation';

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

  useEffect(() => {
    async function fetchVideo() {
      try {
        const response = await fetch(`/api/videos/${params.id}`);
        if (!response.ok) {
          throw new Error('Video not found');
        }
        const data = await response.json();
        setVideo(data.video);
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
              <h1 className="text-3xl font-bold mb-4">{video.title}</h1>
              <p className="text-gray-400 whitespace-pre-wrap">{video.description}</p>
            </div>
          </div>

          {/* Sidebar - Video Information */}
          <div className="space-y-6">
            <Card className="bg-[#111] border-gray-800 p-6">
              <h2 className="text-xl font-semibold mb-4">Video Information</h2>
              
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
    </div>
  );
} 