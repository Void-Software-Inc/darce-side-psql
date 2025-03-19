import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

interface VideoInfoProps {
  author: string;
  type: string;
  number_of_videos?: number;
  labels?: string[];
  created_by: string;
  created_at: string;
}

export function VideoInfo({
  author,
  type,
  number_of_videos,
  labels,
  created_by,
  created_at
}: VideoInfoProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <Card className="bg-[#111] border-gray-800 p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Video Information</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm text-gray-400 mb-1">Author</h3>
            <p className="text-white">{author}</p>
          </div>

          <div>
            <h3 className="text-sm text-gray-400 mb-1">Type</h3>
            <Badge variant="outline" className="bg-[#222] text-white border-gray-700">
              {type}
            </Badge>
          </div>

          {number_of_videos && (
            <div>
              <h3 className="text-sm text-gray-400 mb-1">Number of Videos</h3>
              <p className="text-white">{number_of_videos}</p>
            </div>
          )}

          {labels && labels.length > 0 && (
            <div>
              <h3 className="text-sm text-gray-400 mb-1">Labels</h3>
              <div className="flex flex-wrap gap-2">
                {labels.map((label, index) => (
                  <Badge 
                    key={index}
                    variant="outline" 
                    className="bg-[#222] text-white border-gray-700"
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm text-gray-400 mb-1">Added By</h3>
            <button
              onClick={() => router.push(`/users/${created_by}`)}
              className="text-white hover:underline focus:outline-none"
            >
              {created_by}
            </button>
          </div>

          <div>
            <h3 className="text-sm text-gray-400 mb-1">Added On</h3>
            <p className="text-white">
              {new Date(created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
} 