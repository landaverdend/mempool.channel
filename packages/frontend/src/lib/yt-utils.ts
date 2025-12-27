import { YoutubeMetadata } from '@/contexts/youtubeMetadataContext';

export type VideoValidationResult = {
  valid: boolean;
  error?: string;
};

// Validate that a YouTube video exists and is playable
export async function validateYouTubeVideo(url: string): Promise<VideoValidationResult> {
  const videoId = getYouTubeVideoId(url);

  if (!videoId) {
    return { valid: false, error: 'Invalid YouTube URL format' };
  }

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);

    if (response.status === 404 || response.status === 401) {
      return { valid: false, error: 'Video not found or is private' };
    }

    if (!response.ok) {
      return { valid: false, error: 'Unable to verify video' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Failed to validate video. Please check your connection.' };
  }
}

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
