import { YoutubeMetadata } from '@/contexts/youtubeMetadataContext';

// Extract YouTube video ID from various URL formats
export function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function getYoutubeMetadata(videoId: string): Promise<YoutubeMetadata | null> {
  try {
    const response = await fetch(`https://noembed.com/embed?url=https://youtube.com/watch?v=${videoId}`);
    const data = await response.json();

    return {
      title: data.title as string,
      thumbnailUrl: data.thumbnail_url as string,
      author: data.author_name as string,
    };
  } catch (error) {
    console.error('Error getting youtube metadata ', error);
    return null;
  }
}
