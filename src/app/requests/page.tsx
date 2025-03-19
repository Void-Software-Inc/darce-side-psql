'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search } from 'lucide-react';
import UpvoteButton from './components/UpvoteButton';
import { useRouter } from 'next/navigation';

interface Recommendation {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'denied' | 'resolved';
  created_by: string;
  upvotes_count: number;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const router = useRouter();
  const [createDialog, setCreateDialog] = useState({
    isOpen: false,
    title: '',
    description: ''
  });

  // Filter recommendations based on search query and status
  const filteredRecommendations = recommendations.filter(recommendation => {
    const matchesSearch = 
      recommendation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recommendation.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recommendation.created_by.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      selectedStatus === 'all' || 
      recommendation.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const fetchRecommendations = async () => {
    try {
      const res = await fetch('/api/recommendations/get');
      const data = await res.json();
      
      if (res.ok) {
        setRecommendations(data.recommendations);
      } else {
        setError(data.message || 'Failed to fetch recommendations');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setError('Error loading recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecommendation = async () => {
    try {
      const res = await fetch('/api/recommendations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: createDialog.title,
          description: createDialog.description
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Recommendation created successfully');
        setCreateDialog({ isOpen: false, title: '', description: '' });
        fetchRecommendations();
      } else {
        throw new Error(data.message || 'Failed to create recommendation');
      }
    } catch (error) {
      console.error('Error creating recommendation:', error);
      toast.error(error instanceof Error ? error.message : 'Error creating recommendation');
    }
  };

  // Fetch recommendations on mount
  useEffect(() => {
    fetchRecommendations();
  }, []);

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="p-4 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a]">
          <div className="h-6 bg-[#2a2a2a] rounded w-1/4 mb-2 animate-pulse"></div>
          <div className="h-4 bg-[#2a2a2a] rounded w-3/4 mb-4 animate-pulse"></div>
          <div className="flex justify-between items-center">
            <div className="h-4 bg-[#2a2a2a] rounded w-1/6 animate-pulse"></div>
            <div className="h-4 bg-[#2a2a2a] rounded w-1/6 animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Requests</h1>
            <p className="text-gray-400">Suggest new videos or improvements</p>
          </div>

          <Button
            onClick={() => setCreateDialog({ isOpen: true, title: '', description: '' })}
            className="bg-blue-600 text-white hover:bg-blue-500 w-full sm:w-auto"
          >
            Create Request
          </Button>
        </div>

        {/* Search Bar */}
        <div className="space-y-4">
          {/* Filter Buttons */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            <Button
              variant={selectedStatus === 'all' ? "default" : "outline"}
              className={`
                w-full sm:w-auto
                ${selectedStatus === 'all' 
                  ? 'bg-white text-black hover:bg-gray-200' 
                  : 'bg-[#111] border-gray-800 text-gray-400 hover:text-white hover:bg-[#222]'}
                transition-all duration-200 text-sm
              `}
              onClick={() => setSelectedStatus('all')}
            >
              All Requests
            </Button>
            <Button
              variant={selectedStatus === 'pending' ? "default" : "outline"}
              className={`
                w-full sm:w-auto
                ${selectedStatus === 'pending' 
                  ? 'bg-white text-black hover:bg-gray-200' 
                  : 'bg-[#111] border-gray-800 text-gray-400 hover:text-white hover:bg-[#222]'}
                transition-all duration-200 text-sm
              `}
              onClick={() => setSelectedStatus('pending')}
            >
              Pending
            </Button>
            <Button
              variant={selectedStatus === 'resolved' ? "default" : "outline"}
              className={`
                w-full sm:w-auto
                ${selectedStatus === 'resolved' 
                  ? 'bg-white text-black hover:bg-gray-200' 
                  : 'bg-[#111] border-gray-800 text-gray-400 hover:text-white hover:bg-[#222]'}
                transition-all duration-200 text-sm
              `}
              onClick={() => setSelectedStatus('resolved')}
            >
              Resolved
            </Button>
            <Button
              variant={selectedStatus === 'denied' ? "default" : "outline"}
              className={`
                w-full sm:w-auto
                ${selectedStatus === 'denied' 
                  ? 'bg-white text-black hover:bg-gray-200' 
                  : 'bg-[#111] border-gray-800 text-gray-400 hover:text-white hover:bg-[#222]'}
                transition-all duration-200 text-sm
              `}
              onClick={() => setSelectedStatus('denied')}
            >
              Denied
            </Button>
          </div>

          {/* Search Input */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#111] border-gray-800 text-gray-200 w-full"
              />
            </div>
          </div>
        </div>

        {/* Recommendations List */}
        <div className="grid gap-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-gray-800 border-t-gray-400 rounded-full animate-spin"></div>
            </div>
          ) : filteredRecommendations.length > 0 ? (
            filteredRecommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className={`bg-[#111] border ${
                  recommendation.status === 'pending'
                    ? 'border-gray-800'
                    : recommendation.status === 'resolved'
                    ? 'border-green-900/30'
                    : 'border-red-900/30'
                } rounded-lg p-4`}
              >
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">
                    {recommendation.title}
                  </h3>
                  <p className="text-gray-400">{recommendation.description}</p>
                  {recommendation.admin_response && (
                    <div className="mt-4 p-3 bg-[#1a1a1a] rounded border border-gray-800">
                      <p className="text-sm text-gray-300">
                        <span className="font-semibold text-gray-400">Admin Response: </span>
                        {recommendation.admin_response}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <button
                      onClick={() => router.push(`/users/${recommendation.created_by}`)}
                      className="hover:underline focus:outline-none"
                    >
                      By {recommendation.created_by}
                    </button>
                    <div className="flex items-center gap-4">
                      <UpvoteButton
                        recommendationId={recommendation.id}
                        initialUpvotesCount={recommendation.upvotes_count}
                        disabled={recommendation.status !== 'pending'}
                      />
                      <span>{new Date(recommendation.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              No recommendations found
            </div>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog 
        open={createDialog.isOpen} 
        onOpenChange={(isOpen) => 
          setCreateDialog(prev => ({ ...prev, isOpen }))
        }
      >
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-gray-200">
          <DialogHeader>
            <DialogTitle className="text-white">Create Recommendation</DialogTitle>
            <DialogDescription className="text-gray-400">
              Suggest a new video or improvement for the platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Title</label>
              <Input
                placeholder="Enter a title"
                value={createDialog.title}
                onChange={(e) => setCreateDialog(prev => ({ ...prev, title: e.target.value }))}
                className="bg-[#222222] border-[#2a2a2a] text-gray-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Description</label>
              <Textarea
                placeholder="Describe your recommendation"
                value={createDialog.description}
                onChange={(e) => setCreateDialog(prev => ({ ...prev, description: e.target.value }))}
                className="bg-[#222222] border-[#2a2a2a] text-gray-200 min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              className="w-full sm:w-auto bg-[#2a2a2a] hover:bg-[#333333] text-white"
              onClick={handleCreateRecommendation}
              disabled={!createDialog.title.trim() || !createDialog.description.trim()}
            >
              Submit
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto bg-transparent border-gray-800 text-gray-400 hover:bg-[#222222] hover:text-gray-200"
              onClick={() => setCreateDialog({ isOpen: false, title: '', description: '' })}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 