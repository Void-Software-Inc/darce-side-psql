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
  const [createDialog, setCreateDialog] = useState({
    isOpen: false,
    title: '',
    description: ''
  });

  // Filter recommendations based on search query
  const filteredRecommendations = recommendations.filter(recommendation => 
    recommendation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recommendation.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recommendation.created_by.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            onClick={() => setCreateDialog(prev => ({ ...prev, isOpen: true }))}
            className="w-full sm:w-auto bg-[#2a2a2a] hover:bg-[#333333] text-white"
          >
            Create Recommendation
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search recommendations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#222222] border-[#2a2a2a] text-gray-200"
          />
        </div>

        {/* Recommendations List */}
        <div className="space-y-4">
          {loading ? (
            <LoadingSkeleton />
          ) : filteredRecommendations.length > 0 ? (
            filteredRecommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className="p-4 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{recommendation.title}</h3>
                    <p className="text-gray-400 mt-1">{recommendation.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    recommendation.status === 'resolved'
                      ? 'bg-green-900/20 text-green-400 border border-green-900/30'
                      : recommendation.status === 'denied'
                      ? 'bg-red-900/20 text-red-400 border border-red-900/30'
                      : 'bg-yellow-900/20 text-yellow-400 border border-yellow-900/30'
                  }`}>
                    {recommendation.status.charAt(0).toUpperCase() + recommendation.status.slice(1)}
                  </span>
                </div>

                {recommendation.admin_response && (
                  <div className="mt-4 p-3 rounded bg-[#222222] border border-[#2a2a2a]">
                    <p className="text-sm text-gray-400">Admin Response:</p>
                    <p className="text-gray-200 mt-1">{recommendation.admin_response}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>By {recommendation.created_by}</span>
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