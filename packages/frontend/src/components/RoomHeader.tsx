import { ClientRoomInfo } from '@mempool/shared';

type RoomHeaderProps = {
  roomState: ClientRoomInfo;
};

export default function RoomHeader({ roomState }: RoomHeaderProps) {
  const copyRoomCode = () => {};

  const handleLeave = () => {};

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <span
            className="font-mono text-indigo-400 cursor-pointer hover:text-indigo-300"
            onClick={copyRoomCode}
            title="Click to copy">
            {roomState.roomCode}
          </span>
          {roomState.isHost && <span className="text-sm bg-yellow-600 px-2 py-1 rounded">HOST</span>}
        </h1>
        <p className="text-gray-400 text-sm mt-1">{}</p>
      </div>
      <button
        onClick={handleLeave}
        className={`px-4 py-2 rounded cursor-pointer transition-colors ${
          roomState.isHost ? 'bg-red-700 hover:bg-red-600' : 'bg-orange-700 hover:bg-orange-600'
        } text-gray-100`}>
        {roomState.isHost ? 'Close Room' : 'Leave Room'}
      </button>
    </div>
  );
}
