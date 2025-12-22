import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useWebSocket } from './websocket-context';
import { getYoutubeMetadata, getYouTubeVideoId } from '@/lib/yt-utils';

export interface YoutubeMetadata {
  thumbnailUrl: string;
  title: string;
  author: string;
}

interface YoutubeMetadataContextValue {
  cache: Map<string, YoutubeMetadata>;
  getMetadata: (url: string) => YoutubeMetadata | null;
}

const YoutubeMetadataContext = createContext<YoutubeMetadataContextValue | null>(null);

export default function YoutubeMetadataProvider({ children }: { children: React.ReactNode }) {
  const { roomState } = useWebSocket();

  //
  const [cache] = useState<Map<string, YoutubeMetadata>>(new Map());

  // Extract all URLs from room state
  const allUrls = useMemo(() => {
    const urls: string[] = [];
    if (roomState.currentlyPlaying) urls.push(roomState.currentlyPlaying.url);
    roomState.playedRequests.forEach((r) => urls.push(r.url));
    roomState.requestQueue.forEach((r) => urls.push(r.url));
    return urls;
  }, [roomState]);

  // Pre-fetch any URLs not in cache
  useEffect(() => {
    allUrls.forEach((url) => {
      const videoId = getYouTubeVideoId(url);
      if (videoId && !cache.has(videoId)) {
        getYoutubeMetadata(videoId).then((metadata) => {
          if (metadata) {
            cache.set(videoId, metadata);
          }
        });
      }
    });
  }, [allUrls]);

  const getMetadata = (url: string) => {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) return null;
    return cache.get(videoId) ?? null;
  };

  return <YoutubeMetadataContext.Provider value={{ cache, getMetadata }}>{children}</YoutubeMetadataContext.Provider>;
}

export function useYoutubeMetadata() {
  const context = useContext(YoutubeMetadataContext);

  if (!context) {
    throw new Error('useYoutubeMetadata must be used within a YoutubeMetadataProvider');
  }
  return context;
}
