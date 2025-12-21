import { useWebSocket } from '@/contexts/websocket-context';
import { ClientRoomInfo } from '@mempool/shared';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

type RoomHeaderProps = {
  roomState: ClientRoomInfo;
};

export default function RoomHeader({ roomState }: RoomHeaderProps) {
  const { leaveRoom, closeRoom } = useWebSocket();
  const navigate = useNavigate();

  const copyRoomCode = () => {
    if (roomState.roomCode) {
      navigator.clipboard.writeText(roomState.roomCode);
    }
  };

  const handleLeave = () => {
    if (roomState.isHost) {
      closeRoom();
    } else {
      leaveRoom();
    }
    navigate('/');
  };

  return (
    <Navbar>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-lg text-link cursor-pointer hover:text-info transition-colors"
            onClick={copyRoomCode}
            title="Click to copy room code">
            {roomState.roomCode}
          </span>
          {roomState.isHost && (
            <span className="text-xs bg-taproot text-bg px-2 py-0.5 rounded font-semibold">HOST</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-fg-muted">
          <span>{roomState.members.length}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4">
            <path d="M15 14c2.67 0 8 1.33 8 4v2H7v-2c0-2.67 5.33-4 8-4zm-9-1c-2.67 0-8 1.34-8 4v2h6v-2c0-1.53.8-2.84 2.01-3.88A9 9 0 0 0 6 13zm9-5a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
          </svg>
        </div>

        <button
          onClick={handleLeave}
          className={`px-3 py-1.5 rounded text-sm font-medium cursor-pointer transition-colors ${
            roomState.isHost
              ? 'bg-red text-fg hover:opacity-80'
              : 'bg-secondary text-fg hover:bg-border'
          }`}>
          {roomState.isHost ? 'Close Room' : 'Leave'}
        </button>
      </div>
    </Navbar>
  );
}
