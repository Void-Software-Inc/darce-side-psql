import { motion } from "framer-motion";
import { useState } from "react";
import useMeasure from "react-use-measure";
import { Card } from "@/components/ui/card";
import { Heart, MessageSquare, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const BREAKPOINTS = {
  sm: 640,
  lg: 1024,
};

interface Video {
  id: number;
  title: string;
  description: string;
  image_url: string;
  type: string;
  author: string;
  created_at: string;
  created_by: string;
  likes_count: number;
  comments_count: number;
}

interface VideoCarouselProps {
  title: string;
  videos: Video[];
  type: 'instructionals' | 'matches' | 'tournaments';
}

export const VideoCarousel = ({ title, videos, type }: VideoCarouselProps) => {
  const [ref, { width }] = useMeasure();
  const [offset, setOffset] = useState(0);
  const router = useRouter();

  // Calculate card width based on screen size
  const cardWidth = width > BREAKPOINTS.sm ? 350 : width - 48; // 48px for padding
  const margin = width > BREAKPOINTS.sm ? 20 : 12; // Small gap on mobile
  const cardSize = cardWidth + margin;

  // Take only the first 5 videos to leave space for the View More card
  const displayVideos = videos.slice(0, 5);

  // On mobile, we want to show exactly one card
  const CARD_BUFFER = width > BREAKPOINTS.lg ? 3 : width > BREAKPOINTS.sm ? 2 : 1;
  const totalItems = displayVideos.length + 1; // +1 for View More card
  const CAN_SHIFT_LEFT = offset < 0;
  const CAN_SHIFT_RIGHT = Math.abs(offset) < cardSize * (totalItems - CARD_BUFFER);

  const shiftLeft = () => {
    if (!CAN_SHIFT_LEFT) return;
    setOffset((pv) => (pv += cardSize));
  };

  const shiftRight = () => {
    if (!CAN_SHIFT_RIGHT) return;
    setOffset((pv) => (pv -= cardSize));
  };

  const handleViewMore = () => {
    router.push(`/videos?type=${type}`);
  };

  return (
    <section className="py-8" ref={ref}>
      <div className="relative overflow-hidden px-6">
        <div className="mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white">{title}</h2>

            <div className="flex items-center gap-2">
              <button
                className={`rounded-lg border border-gray-800 bg-[#111] p-1.5 text-2xl transition-opacity hover:bg-[#222] ${
                  CAN_SHIFT_LEFT ? "" : "opacity-30"
                }`}
                disabled={!CAN_SHIFT_LEFT}
                onClick={shiftLeft}
              >
                <ChevronLeft className="text-gray-400 h-5 w-5 md:h-6 md:w-6" />
              </button>
              <button
                className={`rounded-lg border border-gray-800 bg-[#111] p-1.5 text-2xl transition-opacity hover:bg-[#222] ${
                  CAN_SHIFT_RIGHT ? "" : "opacity-30"
                }`}
                disabled={!CAN_SHIFT_RIGHT}
                onClick={shiftRight}
              >
                <ChevronRight className="text-gray-400 h-5 w-5 md:h-6 md:w-6" />
              </button>
            </div>
          </div>
          <div className="relative">
            <motion.div
              animate={{
                x: offset,
              }}
              transition={{
                ease: "easeInOut",
              }}
              className="flex"
              style={{
                gap: `${margin}px`,
              }}
            >
              {displayVideos.map((video) => (
                <VideoCard key={video.id} video={video} width={cardWidth} margin={0} />
              ))}
              
              <ViewMoreCard onClick={handleViewMore} width={cardWidth} margin={0} />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

const VideoCard = ({ video, width, margin }: { video: Video; width: number; margin: number }) => {
  const router = useRouter();

  return (
    <Card
      className="relative shrink-0 cursor-pointer bg-[#111] border-gray-800 overflow-hidden hover:border-gray-600 transition-all hover:-translate-y-1"
      style={{
        width,
        marginRight: margin,
      }}
      onClick={() => router.push(`/videos/${video.id}?title=${encodeURIComponent(video.title)}`)}
    >
      <div className="relative aspect-square w-full bg-[#111]">
        <Image
          src={video.image_url}
          alt={video.title}
          fill
          className="object-contain"
          priority={false}
        />
      </div>
      <div className="p-3">
        <h3 className="text-lg font-semibold mb-1 text-white line-clamp-2">{video.title}</h3>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">by {video.author}</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-sm text-gray-400">
              <MessageSquare className="h-4 w-4" />
              {video.comments_count || 0}
            </span>
            <span className="flex items-center gap-1 text-sm text-gray-400">
              <Heart className="h-4 w-4" />
              {video.likes_count || 0}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

const ViewMoreCard = ({ onClick, width, margin }: { onClick: () => void; width: number; margin: number }) => {
  return (
    <Card
      className="relative shrink-0 cursor-pointer bg-[#111] border-gray-800 overflow-hidden hover:border-gray-600 transition-all hover:-translate-y-1 flex items-center justify-center"
      style={{
        width,
        marginRight: margin,
      }}
      onClick={onClick}
    >
      <div className="p-6 flex flex-col items-center gap-4 text-center">
        <ArrowRight className="h-12 w-12 text-gray-400" />
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">View More</h3>
          <p className="text-sm text-gray-400">Discover all videos in this category</p>
        </div>
      </div>
    </Card>
  );
}; 