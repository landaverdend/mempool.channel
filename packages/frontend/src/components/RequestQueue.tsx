import { ClientRequest, ClientRoomInfo } from '@mempool/shared';

type RequestQueueProps = {
  roomState: ClientRoomInfo;
};
export function RequestQueue({ roomState }: RequestQueueProps) {
  const { requestQueue } = roomState;

  return (
    <div className="w-full mx-10">
      <div className="flex flex-row gap-2 justify-between">
        {requestQueue.length === 0 && <div>No requests in queue</div>}
        {requestQueue.map((request, i) => (
          <RequestQueueItem key={request.createdAt} request={request} />
        ))}
      </div>
    </div>
  );
}

function RequestQueueItem({ request }: { request: ClientRequest }) {
  return <div className="w-[125px] h-[125px] bg-(--gradient-striped-progress)">item {request.url}</div>;
}
