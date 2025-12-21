import { ClientRequest, ClientRoomInfo } from '@mempool/shared';
import { useMemo } from 'react';

type RequestQueueProps = {
  roomState: ClientRoomInfo;
};
export function RequestQueue({ roomState }: RequestQueueProps) {
  const { requestQueue } = roomState;

  return (
    <div className="w-full mx-10">
      <div className="flex flex-row gap-4 ">
        {requestQueue.length === 0 && <div>No requests in queue</div>}
        {requestQueue.map((request, i) => (
          <span key={request.createdAt} className="flex flex-col items-center gap-5 pt-4 pl-6 ">
            <span className="text-md text-link font-semibold">{i + 1}</span>
            <RequestQueueItem key={request.createdAt} request={request} />
            <span className="text-md font-bold">{request.requesterId}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function RequestQueueItem({ request }: { request: ClientRequest }) {
  const createdAt = useMemo(() => new Date(request.createdAt).toLocaleTimeString(), [request.createdAt]);

  return (
    <div
      className="block-3d w-(--block-size) h-(--block-size) flex flex-col items-center justify-center"
      style={{ background: 'var(--gradient-block)' }}>
      <div className="font-bold flex items-center gap-1 text-2xl">
        {request.amount}
        <svg className="-skew-x-5" width="24px" height="24px" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M12.75 18.5V21H11.25V18.5H12.75Z" fill="white" />
          <path fill-rule="evenodd" clip-rule="evenodd" d="M17 16.75H7V15.25H17V16.75Z" fill="white" />
          <path fill-rule="evenodd" clip-rule="evenodd" d="M17 12.7499H7V11.2499H17V12.7499Z" fill="white" />
          <path fill-rule="evenodd" clip-rule="evenodd" d="M17 8.75H7V7.25H17V8.75Z" fill="white" />
          <path fill-rule="evenodd" clip-rule="evenodd" d="M12.75 3V5.5H11.25V3H12.75Z" fill="white" />
        </svg>
      </div>
      <div className="text-md">{createdAt}</div>
    </div>
  );
}
