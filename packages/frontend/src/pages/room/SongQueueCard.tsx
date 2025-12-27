import { useRoom } from '@/hooks/useRoom';
import { useYoutubeMetadata } from '@/contexts/youtubeMetadataContext';
import { Client, ClientRequest } from '@mempool/shared';
import { SatsIcon } from '@/components/Icons';
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SongQueueCard() {
  const { roomState } = useRoom();
  const { requestQueue, members } = roomState;

  const maxBid = useMemo(() => {
    if (requestQueue.length === 0) return 1;
    return Math.max(...requestQueue.map((r) => r.amount));
  }, [requestQueue]);

  return (
    <div className="bg-bg-card rounded-sm h-[400px] flex flex-col">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-lg font-semibold text-fg ">Song Pool</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {requestQueue.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-fg-muted text-sm">Waiting for requests...</span>
          </div>
        ) : (
          <div>
            <AnimatePresence initial={false}>
              {requestQueue.map((request) => (
                <SongRow key={request.createdAt} request={request} members={members} maxBid={maxBid} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {requestQueue.length > 0 && (
        <div className="px-4 py-2 border-t border-border bg-bg-stat">
          <div className="flex justify-between text-xs text-fg-muted">
            <span>{requestQueue.length} pending</span>
            <span className="font-mono">{requestQueue.reduce((sum, r) => sum + r.amount, 0).toLocaleString()} sats total</span>
          </div>
        </div>
      )}
    </div>
  );
}

type SongRowProps = {
  request: ClientRequest;
  members: Client[];
  maxBid: number;
};

function SongRow({ request, members, maxBid }: SongRowProps) {
  const { getMetadata } = useYoutubeMetadata();
  const metadata = getMetadata(request.url);

  const requesterName = useMemo(() => {
    const member = members.find((m) => m.clientId === request.requesterId);
    return member?.name || 'anon';
  }, [members, request.requesterId]);

  const bidPercent = (request.amount / maxBid) * 100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{
        layout: { type: 'spring', stiffness: 500, damping: 35 },
        opacity: { duration: 0.2 },
        x: { duration: 0.2 },
      }}
      className="relative border-b border-border/40 last:border-b-0">
      {/* Fee rate style bar */}
      <motion.div
        className="absolute inset-y-0 left-0 animate-[bar-pulse_2s_ease-in-out_infinite]"
        initial={{ width: 0 }}
        animate={{ width: `${bidPercent}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          background: 'linear-gradient(90deg, rgba(120, 100, 90, 0.5) 0%, rgba(0, 170, 80, 0.6) 100%)',
        }}
      />

      <div className="relative px-4 py-3 flex items-center gap-3">
        {/* Thumbnail */}
        {metadata ? (
          <img src={metadata.thumbnailUrl} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded bg-bg-skeleton animate-pulse shrink-0" />
        )}

        {/* Song info */}
        <div className="flex-1 min-w-0">
          {metadata ? (
            <>
              <p className="text-sm text-fg truncate">{metadata.title}</p>
              <p className="text-xs text-fg-muted truncate">{metadata.author}</p>
            </>
          ) : (
            <>
              <div className="h-4 w-32 bg-bg-skeleton rounded animate-pulse mb-1" />
              <div className="h-3 w-20 bg-bg-skeleton rounded animate-pulse" />
            </>
          )}
        </div>

        {/* Bid amount or Host label */}
        <div className="shrink-0 text-right">
          {request.isHostRequest ? (
            <div className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-semibold rounded">
              Host
            </div>
          ) : (
            <div className="flex items-center gap-1 text-white text-sm font-semibold">
              <span>{request.amount.toLocaleString()}</span>
              <SatsIcon width={14} height={14} />
            </div>
          )}
          <p className="text-[10px] text-fg-muted">{requesterName}</p>
        </div>
      </div>
    </motion.div>
  );
}
