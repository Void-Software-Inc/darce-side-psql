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
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

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

const RECOMMENDATIONS_PER_PAGE = 5;

export default function RecommendationsOverview() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean;
    recommendationId: number | null;
    title: string;
    action: 'resolved' | 'denied' | null;
    response: string;
  }>({
    isOpen: false,
    recommendationId: null,
    title: '',
    action: null,
    response: ''
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    recommendationId: number | null;
    title: string;
  }>({
    isOpen: false,
    recommendationId: null,
    title: ''
  });

  // Filter recommendations based on search query
  const filteredRecommendations = recommendations.filter(recommendation => 
    recommendation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recommendation.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recommendation.created_by.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredRecommendations.length / RECOMMENDATIONS_PER_PAGE);
  const paginatedRecommendations = filteredRecommendations.slice(
    (currentPage - 1) * RECOMMENDATIONS_PER_PAGE,
    currentPage * RECOMMENDATIONS_PER_PAGE
  );

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const fetchRecommendations = async () => {
    try {
      const res = await fetch('/api/recommendations/get');
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations);
      } else {
        setError('Failed to fetch recommendations');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setError('Error loading recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleAction = async () => {
    if (!actionDialog.recommendationId || !actionDialog.action || !actionDialog.response.trim()) return;

    try {
      const res = await fetch('/api/admin/recommendations/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: actionDialog.recommendationId,
          status: actionDialog.action,
          admin_response: actionDialog.response
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Recommendation ${actionDialog.action}d successfully`);
        fetchRecommendations();
      } else {
        throw new Error(data.message || `Failed to ${actionDialog.action} recommendation`);
      }
    } catch (error) {
      console.error('Error updating recommendation:', error);
      toast.error(error instanceof Error ? error.message : 'Error updating recommendation');
    } finally {
      setActionDialog({ isOpen: false, recommendationId: null, title: '', action: null, response: '' });
    }
  };

  const handleDelete = async (recommendationId: number) => {
    try {
      const res = await fetch(`/api/admin/recommendations/delete?id=${recommendationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Recommendation deleted successfully');
        fetchRecommendations();
      } else {
        throw new Error(data.message || 'Failed to delete recommendation');
      }
    } catch (error) {
      console.error('Error deleting recommendation:', error);
      toast.error(error instanceof Error ? error.message : 'Error deleting recommendation');
    }
  };

  const LoadingSkeleton = () => (
    <div className="min-w-[640px]">
      <Table>
        <TableHeader>
          <TableRow className="border-gray-800">
            <TableHead className="text-gray-400 font-medium">Title</TableHead>
            <TableHead className="text-gray-400 font-medium hidden md:table-cell">Description</TableHead>
            <TableHead className="text-gray-400 font-medium">Status</TableHead>
            <TableHead className="text-gray-400 font-medium hidden sm:table-cell">Created By</TableHead>
            <TableHead className="text-gray-400 font-medium hidden sm:table-cell">Upvotes</TableHead>
            <TableHead className="text-gray-400 font-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, index) => (
            <TableRow key={index} className="border-gray-800">
              <TableCell className="py-3">
                <div className="h-4 bg-gray-800 rounded animate-pulse w-32"></div>
              </TableCell>
              <TableCell className="py-3 hidden md:table-cell">
                <div className="h-4 bg-gray-800 rounded animate-pulse w-48"></div>
              </TableCell>
              <TableCell className="py-3">
                <div className="h-4 bg-gray-800 rounded animate-pulse w-20"></div>
              </TableCell>
              <TableCell className="py-3 hidden sm:table-cell">
                <div className="h-4 bg-gray-800 rounded animate-pulse w-24"></div>
              </TableCell>
              <TableCell className="py-3 hidden sm:table-cell">
                <div className="h-4 bg-gray-800 rounded animate-pulse w-16"></div>
              </TableCell>
              <TableCell className="py-3">
                <div className="h-4 bg-gray-800 rounded animate-pulse w-24"></div>
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
            placeholder="Search by title, description, or creator..."
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
                  <TableHead className="text-gray-400 font-medium hidden md:table-cell">Description</TableHead>
                  <TableHead className="text-gray-400 font-medium">Status</TableHead>
                  <TableHead className="text-gray-400 font-medium hidden sm:table-cell">Created By</TableHead>
                  <TableHead className="text-gray-400 font-medium hidden sm:table-cell">Upvotes</TableHead>
                  <TableHead className="text-gray-400 font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecommendations.map((recommendation) => (
                  <TableRow key={recommendation.id} className="border-[#2a2a2a] hover:bg-[#222222] transition-colors">
                    <TableCell className="text-gray-200 py-3">
                      <div>
                        <div className="font-medium">{recommendation.title}</div>
                        <div className="text-gray-400 text-sm md:hidden">{recommendation.description}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-200 py-3 hidden md:table-cell">
                      {recommendation.description}
                    </TableCell>
                    <TableCell className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        recommendation.status === 'resolved'
                          ? 'bg-green-900/20 text-green-400 border border-green-900/30'
                          : recommendation.status === 'denied'
                          ? 'bg-red-900/20 text-red-400 border border-red-900/30'
                          : 'bg-yellow-900/20 text-yellow-400 border border-yellow-900/30'
                      }`}>
                        {recommendation.status.charAt(0).toUpperCase() + recommendation.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-200 py-3 hidden sm:table-cell">
                      {recommendation.created_by}
                    </TableCell>
                    <TableCell className="text-gray-200 py-3 hidden sm:table-cell">
                      {recommendation.upvotes_count}
                    </TableCell>
                    <TableCell className="py-3 text-left">
                      <div className="flex gap-2">
                        {recommendation.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-400 hover:text-green-300 hover:bg-green-950/30"
                              onClick={() => setActionDialog({
                                isOpen: true,
                                recommendationId: recommendation.id,
                                title: recommendation.title,
                                action: 'resolved',
                                response: ''
                              })}
                            >
                              Resolve
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                              onClick={() => setActionDialog({
                                isOpen: true,
                                recommendationId: recommendation.id,
                                title: recommendation.title,
                                action: 'denied',
                                response: ''
                              })}
                            >
                              Deny
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                          onClick={() => setDeleteDialog({
                            isOpen: true,
                            recommendationId: recommendation.id,
                            title: recommendation.title
                          })}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedRecommendations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-white py-8">
                      No recommendations found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-4 border-t border-[#2a2a2a]">
              <div className="text-sm text-gray-400">
                Showing {((currentPage - 1) * RECOMMENDATIONS_PER_PAGE) + 1} to {Math.min(currentPage * RECOMMENDATIONS_PER_PAGE, filteredRecommendations.length)} of {filteredRecommendations.length} recommendations
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
        open={actionDialog.isOpen} 
        onOpenChange={(isOpen) => 
          setActionDialog(prev => ({ ...prev, isOpen }))
        }
      >
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-gray-200 mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {actionDialog.action === 'resolved' ? 'Resolve' : 'Deny'} Recommendation
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Add a response for the recommendation "{actionDialog.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter your response..."
              value={actionDialog.response}
              onChange={(e) => setActionDialog(prev => ({ ...prev, response: e.target.value }))}
              className="bg-[#222222] border-[#2a2a2a] text-gray-200 min-h-[100px]"
            />
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant={actionDialog.action === 'resolved' ? 'default' : 'destructive'}
              className="w-full sm:w-auto"
              onClick={handleAction}
              disabled={!actionDialog.response.trim()}
            >
              {actionDialog.action === 'resolved' ? 'Resolve' : 'Deny'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto bg-transparent border-gray-800 text-gray-400 hover:bg-[#222222] hover:text-gray-200"
              onClick={() => setActionDialog({ isOpen: false, recommendationId: null, title: '', action: null, response: '' })}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={deleteDialog.isOpen} 
        onOpenChange={(isOpen) => 
          setDeleteDialog(prev => ({ ...prev, isOpen }))
        }
      >
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-gray-200 mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              Delete Recommendation
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete the recommendation "{deleteDialog.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={() => {
                if (deleteDialog.recommendationId) {
                  handleDelete(deleteDialog.recommendationId);
                  setDeleteDialog({ isOpen: false, recommendationId: null, title: '' });
                }
              }}
            >
              Delete
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto bg-transparent border-gray-800 text-gray-400 hover:bg-[#222222] hover:text-gray-200"
              onClick={() => setDeleteDialog({ isOpen: false, recommendationId: null, title: '' })}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 