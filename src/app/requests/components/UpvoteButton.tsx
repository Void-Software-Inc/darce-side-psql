import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';

interface UpvoteButtonProps {
  recommendationId: number;
  initialUpvotesCount: number;
  initialHasUpvoted?: boolean;
  disabled?: boolean;
}

export default function UpvoteButton({
  recommendationId,
  initialUpvotesCount,
  initialHasUpvoted = false,
  disabled = false
}: UpvoteButtonProps) {
  const [hasUpvoted, setHasUpvoted] = useState(initialHasUpvoted);
  const [upvotesCount, setUpvotesCount] = useState(initialUpvotesCount);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUpvoteStatus();
  }, [recommendationId]);

  const checkUpvoteStatus = async () => {
    try {
      const res = await fetch(`/api/recommendations/upvotes/get?recommendationId=${recommendationId}`);
      const data = await res.json();
      
      if (res.ok) {
        setHasUpvoted(data.hasUpvoted);
      }
    } catch (error) {
      console.error('Error checking upvote status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/recommendations/upvotes/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recommendationId })
      });

      const data = await res.json();

      if (res.ok) {
        setHasUpvoted(data.action === 'added');
        setUpvotesCount(data.upvotesCount);
        toast.success(
          data.action === 'added' 
            ? 'Upvote added successfully' 
            : 'Upvote removed successfully'
        );
      } else {
        throw new Error(data.message || 'Failed to toggle upvote');
      }
    } catch (error) {
      console.error('Error toggling upvote:', error);
      toast.error(error instanceof Error ? error.message : 'Error toggling upvote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`gap-2 ${
        hasUpvoted 
          ? 'text-blue-400 hover:text-blue-500 hover:bg-transparent' 
          : 'text-gray-400 hover:text-gray-300 hover:bg-transparent'
      }`}
      onClick={handleUpvote}
      disabled={loading || disabled}
    >
      <ThumbsUp size={16} className={hasUpvoted ? 'fill-current' : ''} />
      <span>{upvotesCount}</span>
    </Button>
  );
} 