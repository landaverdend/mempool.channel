import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../contexts/websocket-context';

export default function Home() {
  const navigate = useNavigate();

  const { connected, createRoom, joinRoom, roomState, error: wsError, clearError } = useWebSocket();
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [nwcUrl, setNwcUrl] = useState('');
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const error = localError || wsError;

  // Navigate to room when roomState changes
  useEffect(() => {
    if (roomState.roomCode) {
      setIsLoading(false);
      navigate(`/room/${roomState.roomCode}`);
    }
  }, [roomState.roomCode, navigate]);

  // Reset loading on error
  useEffect(() => {
    if (wsError) {
      setIsLoading(false);
    }
  }, [wsError]);

  const handleCreateRoom = () => {
    // Trim and validate lightning address

    if (!nwcUrl) {
      setLocalError('Please enter an NWC string');
      return;
    }

    // Parse the connection string to extract the pubkey
    setLocalError(null);
    clearError();
    setIsLoading(true);

    createRoom({ nwcUrl });
  };

  const handleJoinRoom = () => {
    if (!joinCode.trim()) {
      setLocalError('Please enter a room code');
      return;
    }

    setLocalError(null);
    clearError();
    setIsLoading(true);
    joinRoom(joinCode);
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-slate-900 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">mempool.band</h1>
          <p className="text-gray-400">Connecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">mempool.band</h1>

        {error && (
          <div className="mb-6 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 max-w-md mx-auto">{error}</div>
        )}

        {!showCreateInput && !showJoinInput && (
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setShowCreateInput(true)}
              className="px-8 py-4 bg-green-700 text-gray-100 rounded-lg text-lg font-semibold cursor-pointer hover:bg-green-600 transition-colors">
              Create Room
            </button>
            <button
              onClick={() => setShowJoinInput(true)}
              className="px-8 py-4 bg-indigo-700 text-gray-100 rounded-lg text-lg font-semibold cursor-pointer hover:bg-indigo-600 transition-colors">
              Join Room
            </button>
          </div>
        )}

        {showCreateInput && (
          <div className="max-w-md mx-auto">
            <p className="text-gray-400 mb-4">Enter your NWC String in order to connect</p>
            <input
              type="text"
              value={nwcUrl}
              onChange={(e) => setNwcUrl(e.target.value)}
              placeholder="nwc://<your-nwc-string>"
              className="w-full px-4 py-3 bg-slate-700 text-gray-100 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none mb-4"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateInput(false);
                  setNwcUrl('');
                  setLocalError(null);
                  clearError();
                }}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-slate-700 text-gray-100 rounded-lg cursor-pointer hover:bg-slate-600 transition-colors disabled:opacity-50">
                Back
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-green-700 text-gray-100 rounded-lg cursor-pointer hover:bg-green-600 transition-colors disabled:opacity-50">
                {isLoading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        )}

        {showJoinInput && (
          <div className="max-w-md mx-auto">
            <p className="text-gray-400 mb-4">Enter the 6-character room code</p>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="w-full px-4 py-3 bg-slate-700 text-gray-100 rounded-lg border border-slate-600 focus:border-indigo-500 focus:outline-none mb-4 uppercase tracking-widest text-center font-mono text-2xl"
              onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowJoinInput(false);
                  setJoinCode('');
                  setLocalError(null);
                  clearError();
                }}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-slate-700 text-gray-100 rounded-lg cursor-pointer hover:bg-slate-600 transition-colors disabled:opacity-50">
                Back
              </button>
              <button
                onClick={handleJoinRoom}
                disabled={joinCode.length !== 6 || isLoading}
                className="flex-1 px-4 py-3 bg-indigo-700 text-gray-100 rounded-lg cursor-pointer hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? 'Joining...' : 'Join'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
