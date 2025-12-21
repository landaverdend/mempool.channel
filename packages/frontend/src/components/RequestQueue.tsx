import { ClientRoomInfo } from '@mempool/shared';

type RequestQueueProps = {
  roomState: ClientRoomInfo;
};
export function RequestQueue({ roomState }: RequestQueueProps) {
  const { requestQueue } = roomState;

  return (
    <div>
      <div className="flex flex-row gap-2">
        {requestQueue.length === 0 && <div>No requests in queue</div>}
        {requestQueue.map((request) => (
          <div key={request.createdAt}>{request.url}</div>
        ))}
      </div>
    </div>
  );
}
