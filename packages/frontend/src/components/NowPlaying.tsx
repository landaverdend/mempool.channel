import { useEffect, useRef, useCallback } from 'react';
import { NowPlaying as NowPlayingType } from '@mempool/shared';
import { useWebSocket } from '@/contexts/websocket-context';

type NowPlayingProps = {
  currentlyPlaying: NowPlayingType | null;
  isHost: boolean;
  hasQueue: boolean;
};

// Extract YouTube video ID from various URL formats
function getYouTubeVideoId(url: string): string | null {
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

// Declare YouTube IFrame API types
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number; target: YTPlayer }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayer {
  destroy: () => void;
  loadVideoById: (videoId: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
}

// Load YouTube IFrame API script once
let apiLoaded = false;
let apiReady = false;
const readyCallbacks: (() => void)[] = [];

function loadYouTubeAPI(callback: () => void) {
  if (apiReady) {
    callback();
    return;
  }

  readyCallbacks.push(callback);

  if (!apiLoaded) {
    apiLoaded = true;
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.body.appendChild(script);

    window.onYouTubeIframeAPIReady = () => {
      apiReady = true;
      readyCallbacks.forEach((cb) => cb());
      readyCallbacks.length = 0;
    };
  }
}

export default function NowPlaying({ currentlyPlaying, isHost, hasQueue }: NowPlayingProps) {
  const { playNext, skipCurrent, roomState } = useWebSocket();
  const playerRef = useRef<YTPlayer | null>(null);

  // Use refs to avoid stale closures in YouTube player callbacks
  const roomStateRef = useRef(roomState);
  const playNextRef = useRef(playNext);
  const skipCurrentRef = useRef(skipCurrent);

  // Keep refs updated
  useEffect(() => {
    roomStateRef.current = roomState;
    playNextRef.current = playNext;
    skipCurrentRef.current = skipCurrent;
  }, [roomState, playNext, skipCurrent]);

  const handlePlayNext = useCallback(() => {
    const nextRequest = roomStateRef.current.requestQueue[0];
    if (nextRequest) {
      const videoId = getYouTubeVideoId(nextRequest.url);
      playNextRef.current(nextRequest.url, videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '');
    }
  }, []);

  const handleSkip = () => {
    skipCurrentRef.current();
  };

  // Initialize YouTube player for host
  useEffect(() => {
    if (!isHost || !currentlyPlaying) return;

    const videoId = getYouTubeVideoId(currentlyPlaying.url);
    if (!videoId) return;

    loadYouTubeAPI(() => {
      // Destroy existing player
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      // Create new player
      playerRef.current = new window.YT.Player('youtube-player', {
        videoId,
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onStateChange: (event) => {
            console.log('onStateChange', event);
            // YT.PlayerState.ENDED === 0
            if (event.data === 0) {
              // Video ended, play next if queue has items
              if (roomStateRef.current.requestQueue.length > 0) {
                const nextRequest = roomStateRef.current.requestQueue[0];
                const nextVideoId = getYouTubeVideoId(nextRequest.url);
                playNextRef.current(nextRequest.url, nextVideoId ? `https://i.ytimg.com/vi/${nextVideoId}/hqdefault.jpg` : '');
              } else {
                skipCurrentRef.current();
              }
            }
          },
        },
      });
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isHost, currentlyPlaying?.url]); // Only reinit when URL changes

  if (!currentlyPlaying) {
    return (
      <div className="bg-bg-box border border-border rounded-lg p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-fg mb-1">Now Playing</h2>
            <p className="text-fg-muted text-sm">Nothing playing right now</p>
          </div>
          {isHost && hasQueue && (
            <button
              onClick={handlePlayNext}
              className="px-4 py-2 bg-success text-white rounded font-medium hover:opacity-80 transition-opacity cursor-pointer">
              Play Next
            </button>
          )}
        </div>
      </div>
    );
  }

  const videoId = getYouTubeVideoId(currentlyPlaying.url);

  return (
    <div className="bg-bg-box border border-border rounded-lg p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-fg">Now Playing</h2>
        {isHost && (
          <div className="flex gap-2">
            {hasQueue && (
              <button
                onClick={handlePlayNext}
                className="px-3 py-1.5 bg-primary text-white rounded text-sm font-medium hover:opacity-80 transition-opacity cursor-pointer">
                Next
              </button>
            )}
            <button
              onClick={handleSkip}
              className="px-3 py-1.5 bg-secondary text-fg rounded text-sm font-medium hover:bg-border transition-colors cursor-pointer">
              Skip
            </button>
          </div>
        )}
      </div>

      {/* Host sees the player, guests see the thumbnail */}
      {isHost && videoId ? (
        <div className="aspect-video w-full mb-4">
          <div id="youtube-player" className="w-full h-full rounded" />
        </div>
      ) : (
        <div className="flex gap-4 mb-4">
          <div className="shrink-0">
            <img
              src={currentlyPlaying.thumbnail}
              alt={currentlyPlaying.title}
              className="w-32 h-24 sm:w-40 sm:h-30 object-cover rounded"
            />
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h3 className="font-medium text-fg text-lg">{currentlyPlaying.title}</h3>
            <a
              href={currentlyPlaying.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-link hover:text-info truncate">
              {currentlyPlaying.url}
            </a>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 text-sm text-fg-muted">
        <span className="flex items-center gap-1">
          <span className="font-medium text-fg">{currentlyPlaying.amount}</span>
          <span>sats</span>
        </span>
        <span>requested by {currentlyPlaying.requesterId}</span>
      </div>
    </div>
  );
}
