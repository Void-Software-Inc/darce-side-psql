'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { VideoGridSkeleton } from './components/video-skeleton';
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
}

type VideoType = 'all' | 'instructionals' | 'matches' | 'tournaments';

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

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<VideoType>('all');

  const fetchVideos = async (type: VideoType) => {
    setLoading(true);
    try {
      let endpoint = '/api/videos/get';
      
      if (type !== 'all') {
        endpoint = `/api/videos/${type}/get`;
      }

      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos(selectedType);
  }, [selectedType]);

  const filterButtons: { type: VideoType; label: string }[] = [
    { type: 'all', label: 'All Videos' },
    { type: 'instructionals', label: 'Instructionals' },
    { type: 'matches', label: 'Matches' },
    { type: 'tournaments', label: 'Tournaments' },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">Video Library</h1>
          
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {filterButtons.map(({ type, label }) => (
              <Button
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                className={`
                  ${selectedType === type 
                    ? 'bg-white text-black hover:bg-gray-200' 
                    : 'bg-transparent border-gray-800 text-gray-400 hover:text-white hover:bg-[#111]'}
                  transition-all duration-200
                `}
                onClick={() => setSelectedType(type)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Videos Grid with Skeleton Loading */}
        {loading ? <VideoGridSkeleton /> : <VideoGrid videos={videos} />}
      </div>
    </div>
  );
} 