import { useWebSocket } from '@/contexts/websocketContext';

export default function ChatboxCard() {
  const { roomMessages } = useWebSocket();

  console.log('roomMessages: ', roomMessages);

  return (
    <div className="bg-bg-card rounded-sm p-4">
      <h2 className="text-lg font-semibold ">Chat</h2>

      

    </div>
  );
}
