'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { VideoGridSkeleton } from './components/video-skeleton';
import { useRouter } from 'next/navigation';
import { Heart, MessageSquare, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/lib/hooks/use-debounce';

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

type VideoType = 'all' | 'instructionals' | 'matches' | 'tournaments';

// Function to trim titles to match "Higher Tripod Passing" length (20 characters)
const trimTitle = (title: string, maxLength: number = 21) => {
  if (title.length <= maxLength) return title;
  return title.slice(0, maxLength - 3) + "...";
};

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
        <p className="text-gray-400 text-center">No videos available.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {videos.map((video) => (
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
                  onClick={(e) => handleLike(e, video.id)}
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
  );
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<VideoType>('all');
  const [searchInput, setSearchInput] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('');
  
  // Debounce the search input with a 300ms delay
  const searchQuery = useDebounce(searchInput, 300);

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

  // Get unique authors from videos
  const authors = [...new Set(videos.map(video => video.author))].sort();

  // Filter videos based on search query and selected author
  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAuthor = !selectedAuthor || video.author === selectedAuthor;
    return matchesSearch && matchesAuthor;
  });

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
          
          {/* Search and Filter Section */}
          <div className="space-y-4">
            {/* Filter Buttons */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
              {filterButtons.map(({ type, label }) => (
                <Button
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  className={`
                    w-full sm:w-auto
                    ${selectedType === type 
                      ? 'bg-white text-black hover:bg-gray-200' 
                      : 'bg-[#111] border-gray-800 text-gray-400 hover:text-white hover:bg-[#222]'}
                    transition-all duration-200 text-sm
                  `}
                  onClick={() => setSelectedType(type)}
                >
                  {label}
                </Button>
              ))}
            </div>

            {/* Search and Author Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search videos..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10 bg-[#111] border-gray-800 text-gray-200 w-full"
                />
              </div>
              <select
                value={selectedAuthor}
                onChange={(e) => setSelectedAuthor(e.target.value)}
                className="bg-[#111] border border-gray-800 rounded-md px-3 py-2 text-gray-200 w-full sm:w-48"
              >
                <option value="">All Authors</option>
                {authors.map(author => (
                  <option key={author} value={author}>{author}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Videos Grid with Skeleton Loading */}
        {loading ? <VideoGridSkeleton /> : <VideoGrid videos={filteredVideos} />}

      </div>
    </div>
  );
} 