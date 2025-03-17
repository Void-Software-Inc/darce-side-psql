'use client';

import { Card } from '@/components/ui/card';

function VideoCardSkeleton() {
  return (
    <Card className="bg-[#111] border-gray-800 overflow-hidden flex flex-col">
      <div className="relative aspect-square w-full bg-[#1a1a1a] animate-pulse" />
      <div className="p-3">
        <div className="h-4 bg-[#1a1a1a] rounded animate-pulse mb-2" />
        <div className="h-3 bg-[#1a1a1a] rounded animate-pulse w-1/2" />
      </div>
    </Card>
  );
}

export function VideoGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, index) => (
        <VideoCardSkeleton key={index} />
      ))}
    </div>
  );
} 