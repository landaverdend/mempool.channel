import { useWebSocket } from '@/contexts/websocketContext';
import { useYoutubeMetadata } from '@/contexts/youtubeMetadataContext';
import { ClientRequest } from '@mempool/shared';

export default function SongQueueCard() {
  const { roomState } = useWebSocket();
  const { requestQueue } = roomState;

  return (
    <div className="bg-bg-card rounded-sm p-4">
      <h2 className="text-lg font-semibold mb-4">Song Pool</h2>

      <table className="w-full">
        <thead>
          <tr>
            <th>Song</th>
            <th>Requested by</th>
            <th>Amount Bid</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {requestQueue.map((request) => (
            <tr key={request.createdAt}>
              <td>
                <VideoMetadata request={request} />
              </td>
              <td>{request.requesterId}</td>
              <td>{request.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VideoMetadata({ request }: { request: ClientRequest }) {
  const { getMetadata } = useYoutubeMetadata();

  const metadata = getMetadata(request.url);

  if (!metadata) {
    return <VideoMetadataSkeleton />;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <img src={metadata?.thumbnailUrl} alt={metadata?.title} width={100} height={100} className="rounded-md" />
      <div>
        <h3>{metadata?.title}</h3>
        <p>{metadata?.author}</p>
      </div>
    </div>
  );
}

function VideoMetadataSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-24 h-24 bg-gray-200/50 rounded-md animate-pulse"></div>
      <div className="w-full h-2 bg-gray-200/50 rounded-md animate-pulse"></div>
      <div className="w-full h-2 bg-gray-200/50 rounded-md animate-pulse"></div>
    </div>
  );
}
