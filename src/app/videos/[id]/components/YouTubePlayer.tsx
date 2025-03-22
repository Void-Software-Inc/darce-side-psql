interface YouTubePlayerProps {
  playlistUrl: string;
}

function getYouTubePlaylistId(url: string): string | null {
  const regex = /[?&]list=([^#\&\?]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/live\/([^?#]+)/  // Pattern for live videos
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

export function YouTubePlayer({ playlistUrl }: YouTubePlayerProps) {
  const playlistId = getYouTubePlaylistId(playlistUrl);
  const videoId = getYouTubeVideoId(playlistUrl);
  
  if (!playlistId && !videoId) return null;

  const embedUrl = playlistId 
    ? `https://www.youtube.com/embed/videoseries?list=${playlistId}`
    : `https://www.youtube.com/embed/${videoId}`;

  return (
    <div className="aspect-video w-full">
      <iframe
        src={embedUrl}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full rounded-lg"
      />
    </div>
  );
} 