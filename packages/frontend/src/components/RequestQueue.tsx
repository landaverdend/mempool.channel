import { ClientRequest, ClientRoomInfo } from '@mempool/shared';
import { useMemo, useRef, useState, useCallback, useEffect, forwardRef } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { SatsIcon } from './Icons';
import { useYoutubeMetadata } from '@/contexts/youtubeMetadataContext';

type RequestQueueProps = {
  roomState: ClientRoomInfo;
};
export function RequestQueue({ roomState }: RequestQueueProps) {
  const { requestQueue, playedRequests, currentlyPlaying } = roomState;
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasScrolledOnLoad, setHasScrolledOnLoad] = useState(false);

  const isEmpty = requestQueue.length === 0 && playedRequests.length === 0 && currentlyPlaying === null;

  // Scroll to currently playing element on initial load
  useEffect(() => {
    if (hasScrolledOnLoad || !currentlyPlaying || !currentRef.current || !scrollRef.current) return;

    const container = scrollRef.current;
    const element = currentRef.current;

    // Calculate scroll position to center the element horizontally
    const elementLeft = element.offsetLeft;
    const elementWidth = element.offsetWidth;
    const containerWidth = container.offsetWidth;
    const scrollTo = elementLeft - containerWidth / 2 + elementWidth / 2;

    container.scrollTo({ left: scrollTo, behavior: 'smooth' });
    setHasScrolledOnLoad(true);
  }, [currentlyPlaying, hasScrolledOnLoad]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !scrollRef.current) return;
      e.preventDefault();
      const x = e.pageX - scrollRef.current.offsetLeft;
      const walk = (x - startX) * 1.5;
      scrollRef.current.scrollLeft = scrollLeft - walk;
    },
    [isDragging, startX, scrollLeft]
  );

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      ref={scrollRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`w-full overflow-x-auto scrollbar-none py-4 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}>
      <div className="flex flex-row gap-3 sm:gap-4 w-fit mx-auto px-4 sm:px-6 md:px-10">
        {isEmpty && <div className="text-fg-muted text-3xl sm:text-4xl font-bold mt-4">No requests in queue</div>}

        {playedRequests.map((request, i) => (
          <RequestItem key={request.createdAt} request={request} type="played" index={i} />
        ))}

        {currentlyPlaying && (
          <RequestItem ref={currentRef} index={0} key={currentlyPlaying.createdAt} request={{ ...currentlyPlaying }} type="current" />
        )}

        {requestQueue.map((request, i) => (
          <RequestItem key={request.createdAt} request={request} type="pending" index={i} />
        ))}
      </div>
    </div>
  );
}

type RequestItemProps = {
  request: ClientRequest;
  type: 'played' | 'current' | 'pending';
  index: number;
};

const RequestItem = forwardRef<HTMLDivElement, RequestItemProps>(({ request, type, index }, ref) => {
  return (
    <div ref={ref} className="flex flex-col items-center gap-7 pt-4 pl-4 sm:pl-6 shrink-0">
      <span className={`text-md sm:text-lg text-link font-semibold pr-4 sm:pr-6  ${type === 'played' ? 'visible' : 'invisible'}`}>
        {index + 1}
      </span>
      <RequestBlock request={request} type={type} index={index} />
      <span className="text-xs sm:text-lg font-bold truncate max-w-[100px] sm:max-w-none">{request.requesterName}</span>
    </div>
  );
});

function RequestBlock({ request, type }: RequestItemProps) {
  const { getMetadata } = useYoutubeMetadata();

  const createdAt = useMemo(() => new Date(request.createdAt).toLocaleTimeString(), [request.createdAt]);
  const exactTime = useMemo(() => new Date(request.createdAt).toLocaleString(), [request.createdAt]);
  const metadata = getMetadata(request.url);

  const title = metadata?.title ?? '';

  const [blockClass, blockGradient] = useMemo(() => {
    switch (type) {
      case 'played':
        return ['block-3d-played', 'var(--gradient-block-played)'];
      case 'current':
        return ['block-3d-current', 'var(--gradient-block-current)'];
      case 'pending':
        return ['block-3d-pending', 'var(--gradient-block-pending)'];
    }
  }, [type]);

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <div
          className={`relative ${blockClass} w-(--block-size) h-(--block-size) flex flex-col items-center justify-center cursor-pointer`}
          style={{ background: blockGradient }}>
          <span className={`font-semibold text-xs truncate max-w-[100px] ${type === 'current' ? 'text-white' : 'text-yellow'}`}>
            {title}
          </span>
          <div className="font-bold flex items-center gap-1 text-2xl">
            {request.amount}
            <SatsIcon />
          </div>
          <div className="text-md">{createdAt}</div>
        </div>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="bg-bg-box border border-border rounded-lg p-4 w-80 shadow-xl z-50 focus:outline-none"
          sideOffset={8}>
          {/* Video Info */}
          {metadata && (
            <div className="mb-4">
              <a href={request.url} target="_blank" rel="noopener noreferrer" className="block">
                <img
                  src={metadata.thumbnailUrl}
                  alt={metadata.title}
                  className="w-full rounded-md mb-2 hover:opacity-90 transition-opacity"
                />
              </a>
              <a
                href={request.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:underline font-semibold text-sm line-clamp-2">
                {metadata.title}
              </a>
              <p className="text-fg-muted text-xs mt-1">{metadata.author}</p>
            </div>
          )}

          {/* Request Info */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-fg-muted">Amount</span>
              <span className="font-bold flex items-center gap-1">
                {request.amount}
                <SatsIcon width={14} height={14} />
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-fg-muted">Requested by</span>
              <span className="font-medium">{request.requesterId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fg-muted">Time</span>
              <span className="font-medium">{exactTime}</span>
            </div>
          </div>

          <Popover.Arrow className="fill-bg-box" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
