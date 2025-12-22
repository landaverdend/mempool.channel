import { ClientRequest, ClientRoomInfo } from '@mempool/shared';
import { useMemo } from 'react';

type RequestQueueProps = {
  roomState: ClientRoomInfo;
};
export function RequestQueue({ roomState }: RequestQueueProps) {
  const { requestQueue, playedRequests } = roomState;

  const isEmpty = requestQueue.length === 0 && playedRequests.length === 0;

  return (
    <div className="w-full overflow-x-auto scrollbar-none px-4 sm:px-6 md:px-10 py-4">
      <div className="flex flex-row gap-3 sm:gap-4 justify-center">
        {isEmpty && <div className="text-fg-muted text-3xl sm:text-4xl font-bold mt-4">No requests in queue</div>}

        {playedRequests.map((request, i) => (
          <RequestItem key={request.createdAt} request={request} isPlayed={true} index={i} />
        ))}

        {requestQueue.map((request, i) => (
          <RequestItem key={request.createdAt} request={request} isPlayed={false} index={i} />
        ))}
      </div>
    </div>
  );
}

type RequestItemProps = {
  request: ClientRequest;
  isPlayed: boolean;
  index: number;
};

function RequestItem({ request, isPlayed, index }: RequestItemProps) {
  return (
    <div className="flex flex-col items-center gap-7 pt-4 pl-4 sm:pl-6 shrink-0">
      <span className={`text-md sm:text-lg text-link font-semibold pr-4 sm:pr-6  ${isPlayed ? 'visible' : 'invisible'}`}>
        {index + 1}
      </span>
      <RequestBlock request={request} isPlayed={isPlayed} index={index} />
      <span className="text-xs sm:text-lg font-bold truncate max-w-[100px] sm:max-w-none">{request.requesterId}</span>
    </div>
  );
}

function RequestBlock({ request, isPlayed }: RequestItemProps) {
  const createdAt = useMemo(() => new Date(request.createdAt).toLocaleTimeString(), [request.createdAt]);

  return (
    <div
      className={`relative ${
        isPlayed ? 'block-3d-played ' : 'block-3d-pending '
      } w-(--block-size) h-(--block-size) flex flex-col items-center justify-center`}
      style={{ background: isPlayed ? 'var(--gradient-block-played)' : 'var(--gradient-block-pending)' }}>
      <div className="font-bold flex items-center gap-1 text-2xl">
        {request.amount}
        <svg
          className="-skew-x-10"
          width="24px"
          height="24px"
          viewBox="0 0 24 24"
          fill="white"
          xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M12.75 18.5V21H11.25V18.5H12.75Z" fill="white" />
          <path fillRule="evenodd" clipRule="evenodd" d="M17 16.75H7V15.25H17V16.75Z" fill="white" />
          <path fillRule="evenodd" clipRule="evenodd" d="M17 12.7499H7V11.2499H17V12.7499Z" fill="white" />
          <path fillRule="evenodd" clipRule="evenodd" d="M17 8.75H7V7.25H17V8.75Z" fill="white" />
          <path fillRule="evenodd" clipRule="evenodd" d="M12.75 3V5.5H11.25V3H12.75Z" fill="white" />
        </svg>
      </div>
      <div className="text-md">{createdAt}</div>
    </div>
  );
}
