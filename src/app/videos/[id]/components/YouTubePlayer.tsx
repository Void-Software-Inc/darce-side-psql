interface YouTubePlayerProps {
  playlistUrl: string;
}

function getYouTubePlaylistId(url: string): string | null {
  const regex = /[?&]list=([^#\&\?]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export function YouTubePlayer({ playlistUrl }: YouTubePlayerProps) {
  const playlistId = getYouTubePlaylistId(playlistUrl);
  
  if (!playlistId) return null;

  return (
    <div className="aspect-video w-full">
      <iframe
        src={`https://www.youtube.com/embed/videoseries?list=${playlistId}`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full rounded-lg"
      />
    </div>
  );
} 