import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface Comment {
  id: number;
  content: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  username: string;
  user_id: number;
  user_role: string;
}

interface CommentsProps {
  videoId: string;
}

const COMMENTS_PER_PAGE = 5;

export function Comments({ videoId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Calculate pagination values
  const totalPages = Math.ceil(comments.length / COMMENTS_PER_PAGE);
  const startIndex = (currentPage - 1) * COMMENTS_PER_PAGE;
  const endIndex = startIndex + COMMENTS_PER_PAGE;
  const paginatedComments = comments.slice(startIndex, endIndex);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch comments
        const commentsRes = await fetch(`/api/videos/comments/get?videoId=${videoId}`);
        if (commentsRes.ok) {
          const data = await commentsRes.json();
          setComments(data.comments);
        }

        // Get current user info
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUserRole(userData.user.role);
          setCurrentUserId(userData.user.id);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (videoId) {
      fetchData();
    }
  }, [videoId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/videos/comments/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          content: newComment,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments(prev => [data.comment, ...prev]);
        setNewComment('');
        setCurrentPage(1); // Go to first page when adding new comment
        toast.success('Comment added successfully');
      } else {
        toast.error('Failed to add comment');
      }
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      const res = await fetch(`/api/videos/comments/delete?commentId=${commentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setComments(prev => prev.filter(comment => comment.id !== commentId));
        // If we've deleted the last comment on the current page (except page 1)
        if (paginatedComments.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        }
        toast.success('Comment deleted successfully');
      } else {
        toast.error('Failed to delete comment');
      }
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Comments ({comments.length})</h2>
      
      {/* Add Comment */}
      <div className="space-y-4">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
          className="bg-[#111] border-gray-800 text-white placeholder:text-gray-500 resize-none"
          rows={3}
        />
        <Button
          onClick={handleAddComment}
          disabled={isSubmitting || !newComment.trim()}
          className="bg-white text-black hover:bg-gray-200 transition-colors"
        >
          {isSubmitting ? 'Adding...' : 'Add Comment'}
        </Button>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-gray-800 border-t-gray-400 rounded-full animate-spin"></div>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No comments yet</p>
        ) : (
          <>
            {paginatedComments.map((comment) => (
              <Card key={comment.id} className="bg-[#111] border-gray-800 p-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => router.push(`/users/${comment.username}`)}
                        className="font-semibold text-white hover:underline"
                      >
                        {comment.username}
                      </button>
                      <span className="text-xs text-gray-400">
                        {new Date(comment.created_at).toLocaleDateString()}
                        {comment.is_edited && ' (edited)'}
                      </span>
                    </div>
                    <p className="text-gray-300 whitespace-pre-wrap">{comment.content}</p>
                  </div>
                  {(currentUserRole === 'admin' || currentUserId === comment.user_id) && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Delete comment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </Card>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  disabled={currentPage === 1}
                  className="bg-[#111] border-gray-800 text-white hover:bg-[#222]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage === totalPages}
                  className="bg-[#111] border-gray-800 text-white hover:bg-[#222]"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 