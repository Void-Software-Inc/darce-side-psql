import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash2 } from 'lucide-react';
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

export function Comments({ videoId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
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
      <h2 className="text-2xl font-semibold">Comments</h2>
      
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
        {comments.map((comment) => (
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
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete comment"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 