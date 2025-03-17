'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search } from 'lucide-react';

interface Video {
  id: number;
  title: string;
  description: string;
  type: string;
  author: string;
  number_of_videos: number;
  labels: string[];
  created_at: string;
  created_by: string;
}

const VIDEOS_PER_PAGE = 5;

export default function VideosOverview() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    videoId: number | null;
    title: string;
  }>({
    isOpen: false,
    videoId: null,
    title: ''
  });

  // Filter videos based on search query
  const filteredVideos = videos.filter(video => 
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.labels.some(label => label.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredVideos.length / VIDEOS_PER_PAGE);
  const paginatedVideos = filteredVideos.slice(
    (currentPage - 1) * VIDEOS_PER_PAGE,
    currentPage * VIDEOS_PER_PAGE
  );

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/videos/get');
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos);
      } else {
        setError('Failed to fetch videos');
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      setError('Error loading videos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleDelete = async () => {
    if (!deleteDialog.videoId) return;

    try {
      const res = await fetch(`/api/admin/videos/delete?videoId=${deleteDialog.videoId}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (res.ok) {
        fetchVideos();
      } else {
        setError(data.message || 'Failed to delete video');
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      setError('Error deleting video');
    } finally {
      setDeleteDialog({ isOpen: false, videoId: null, title: '' });
    }
  };

  const LoadingSkeleton = () => (
    <div className="min-w-[640px]">
      <Table>
        <TableHeader>
          <TableRow className="border-gray-800">
            <TableHead className="text-gray-400 font-medium">Title</TableHead>
            <TableHead className="text-gray-400 font-medium">Type</TableHead>
            <TableHead className="text-gray-400 font-medium hidden md:table-cell">Author</TableHead>
            <TableHead className="text-gray-400 font-medium hidden sm:table-cell">Labels</TableHead>
            <TableHead className="text-gray-400 font-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, index) => (
            <TableRow key={index} className="border-gray-800">
              <TableCell className="py-3">
                <div className="h-4 bg-gray-800 rounded animate-pulse w-48"></div>
              </TableCell>
              <TableCell className="py-3">
                <div className="h-4 bg-gray-800 rounded animate-pulse w-24"></div>
              </TableCell>
              <TableCell className="py-3 hidden md:table-cell">
                <div className="h-4 bg-gray-800 rounded animate-pulse w-32"></div>
              </TableCell>
              <TableCell className="py-3 hidden sm:table-cell">
                <div className="h-4 bg-gray-800 rounded animate-pulse w-40"></div>
              </TableCell>
              <TableCell className="py-3">
                <div className="h-4 bg-gray-800 rounded animate-pulse w-16"></div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search by title, author, type, or labels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#222222] border-[#2a2a2a] text-gray-200 w-full sm:w-64"
          />
        </div>
      </div>

      <div className="rounded-lg overflow-x-auto border border-[#2a2a2a]">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="min-w-[640px]">
            <Table>
              <TableHeader>
                <TableRow className="border-[#2a2a2a] bg-[#222222]">
                  <TableHead className="text-gray-400 font-medium">Title</TableHead>
                  <TableHead className="text-gray-400 font-medium">Type</TableHead>
                  <TableHead className="text-gray-400 font-medium hidden md:table-cell">Author</TableHead>
                  <TableHead className="text-gray-400 font-medium hidden sm:table-cell">Labels</TableHead>
                  <TableHead className="text-gray-400 font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedVideos.map((video) => (
                  <TableRow key={video.id} className="border-[#2a2a2a] hover:bg-[#222222] transition-colors">
                    <TableCell className="text-gray-200 py-3">
                      <div>
                        <div>{video.title}</div>
                        <div className="text-gray-400 text-sm md:hidden">by {video.author}</div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        video.type === 'instructional'
                          ? 'bg-purple-900/20 text-purple-400 border border-purple-900/30'
                          : video.type === 'match'
                          ? 'bg-blue-900/20 text-blue-400 border border-blue-900/30'
                          : 'bg-green-900/20 text-green-400 border border-green-900/30'
                      }`}>
                        {video.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-200 py-3 hidden md:table-cell">{video.author}</TableCell>
                    <TableCell className="text-gray-200 py-3 hidden sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {video.labels.map((label, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 rounded text-xs font-medium bg-gray-800 text-gray-300"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                        onClick={() => setDeleteDialog({
                          isOpen: true,
                          videoId: video.id,
                          title: video.title
                        })}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-4 border-t border-[#2a2a2a]">
              <div className="text-sm text-gray-400">
                Showing {((currentPage - 1) * VIDEOS_PER_PAGE) + 1} to {Math.min(currentPage * VIDEOS_PER_PAGE, filteredVideos.length)} of {filteredVideos.length} videos
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-[#222222] border-[#2a2a2a] text-gray-200 hover:bg-[#2a2a2a]"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-[#222222] border-[#2a2a2a] text-gray-200 hover:bg-[#2a2a2a]"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog 
        open={deleteDialog.isOpen} 
        onOpenChange={(isOpen) => 
          setDeleteDialog(prev => ({ ...prev, isOpen }))
        }
      >
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-gray-200 mx-4">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Video</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete "{deleteDialog.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={handleDelete}
            >
              Delete
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto bg-transparent border-gray-800 text-gray-400 hover:bg-[#222222] hover:text-gray-200"
              onClick={() => setDeleteDialog({ isOpen: false, videoId: null, title: '' })}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 