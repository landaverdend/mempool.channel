import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useWebSocket } from './websocketContext';
import { getYoutubeMetadata, getYouTubeVideoId } from '@/lib/yt-utils';

export interface YoutubeMetadata {
  thumbnailUrl: string;
  title: string;
  author: string;
}

interface YoutubeMetadataContextValue {
  cache: Record<string, YoutubeMetadata>;
  getMetadata: (url: string) => YoutubeMetadata | null;
  prefetchMetadata: (url: string) => void;
}

const YoutubeMetadataContext = createContext<YoutubeMetadataContextValue | null>(null);

export default function YoutubeMetadataProvider({ children }: { children: React.ReactNode }) {
  const { roomState } = useWebSocket();

  const [cache, setCache] = useState<Record<string, YoutubeMetadata>>({});

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
      if (videoId && !cache[videoId]) {
        getYoutubeMetadata(videoId).then((metadata) => {
          if (metadata) {
            setCache((prev) => ({ ...prev, [videoId]: metadata }));
          }
        });
      }
    });
  }, [allUrls, cache]);

  const prefetchMetadata = (url: string) => {
    const videoId = getYouTubeVideoId(url);
    if (!videoId || cache[videoId]) return;

    getYoutubeMetadata(videoId).then((metadata) => {
      if (metadata) {
        setCache((prev) => ({ ...prev, [videoId]: metadata }));
      }
    });
  };

  const getMetadata = (url: string) => {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) return null;

    if (cache[videoId]) return cache[videoId];

    // Trigger fetch if not in cache
    prefetchMetadata(url);
    return null;
  };

  return <YoutubeMetadataContext.Provider value={{ cache, getMetadata, prefetchMetadata }}>{children}</YoutubeMetadataContext.Provider>;
}

export function useYoutubeMetadata() {
  const context = useContext(YoutubeMetadataContext);

  if (!context) {
    throw new Error('useYoutubeMetadata must be used within a YoutubeMetadataProvider');
  }
  return context;
}
