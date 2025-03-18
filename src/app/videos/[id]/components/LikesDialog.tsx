import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LikeUser {
  username: string;
  created_at: string;
}

interface LikesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loadingLikes: boolean;
  likeUsers: LikeUser[];
}

export function LikesDialog({ open, onOpenChange, loadingLikes, likeUsers }: LikesDialogProps) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#111] border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Liked by</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {loadingLikes ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-gray-800 border-t-gray-400 rounded-full animate-spin"></div>
            </div>
          ) : likeUsers.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No likes yet</p>
          ) : (
            <div className="space-y-3">
              {likeUsers.map((user, index) => (
                <div key={index} className="flex items-center justify-between">
                  <button
                    onClick={() => router.push(`/users/${user.username}`)}
                    className="text-white hover:underline transition-all duration-300"
                  >
                    {user.username}
                  </button>
                  <span className="text-sm text-gray-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 