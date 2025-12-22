import { useRef, useEffect } from 'react';
import YouTube, { YouTubeEvent } from 'react-youtube';
import { NowPlaying as NowPlayingType } from '@mempool/shared';
import { useWebSocket } from '@/contexts/websocket-context';
import SatsIcon from './SatsIcon';
import { getYouTubeVideoId } from '@/lib/yt-utils';

type NowPlayingProps = {
  currentlyPlaying: NowPlayingType | null;
  isHost: boolean;
  hasQueue: boolean;
};

export default function NowPlaying({ currentlyPlaying, isHost, hasQueue }: NowPlayingProps) {
  const { playNext, roomState } = useWebSocket();

  // Use refs to get latest values in callbacks
  const roomStateRef = useRef(roomState);
  const playNextRef = useRef(playNext);

  useEffect(() => {
    console.log('roomState changed ', roomState);
    roomStateRef.current = roomState;
    playNextRef.current = playNext;
  }, [roomState, playNext]);

  const handlePlayNext = () => {
    // Send message to server to play next item in the queue
    playNextRef.current();
  };

  const handleVideoEnd = (event: YouTubeEvent) => {
    console.log('Video ended', event);
    if (roomStateRef.current.requestQueue.length > 0) {
      handlePlayNext();
    }
  };

  if (!currentlyPlaying) {
    return (
      <div className="bg-bg-card rounded-sm p-4 sm:p-6">
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
    <div className="bg-bg-card rounded-sm p-4 sm:p-6">
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
          </div>
        )}
      </div>

      {/* Host sees the player, guests see the thumbnail */}
      {isHost && videoId ? (
        <div className="aspect-video w-full mb-4">
          <YouTube
            videoId={videoId}
            opts={{
              width: '100%',
              height: '100%',
              playerVars: {
                autoplay: 1,
                rel: 0,
                modestbranding: 1,
              },
            }}
            onEnd={handleVideoEnd}
            className="w-full h-full"
            iframeClassName="w-full h-full rounded"
          />
        </div>
      ) : (
        <div className="flex gap-4 mb-4">
          <div className="shrink-0">
            <img
              src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
              alt={currentlyPlaying.url}
              className="w-32 h-24 sm:w-40 sm:h-30 object-cover rounded"
            />
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h3 className="font-medium text-fg text-lg">{currentlyPlaying.url}</h3>
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
        <span className="flex items-center">
          <span className="font-medium text-fg">{currentlyPlaying.amount}</span>
          <SatsIcon className="w-5 h-5" />
        </span>
        <span>requested by {currentlyPlaying.requesterId}</span>
      </div>
    </div>
  );
}
