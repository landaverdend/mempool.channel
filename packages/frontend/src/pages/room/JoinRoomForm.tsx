import Navbar from '@/components/Navbar';
import { useWebSocket } from '@/contexts/websocketContext';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function JoinRoomForm() {
  const navigate = useNavigate();
  const { roomCode } = useParams<{ roomCode: string }>();
  const { error, joinRoom } = useWebSocket();
  const [joinName, setJoinName] = useState('');

  const [isJoining, setIsJoining] = useState(false);

  const handleJoinRoom = () => {
    if (!roomCode || !joinName.trim()) return;
    setIsJoining(true);
    joinRoom({ roomCode, name: joinName.trim() });
  };

  useEffect(() => {
    if (error) {
      setIsJoining(false);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {error && (
            <div className="mb-4 p-4 bg-red/10 border border-red/30 rounded-lg">
              <p className="text-red text-sm">{error}</p>
              <button onClick={() => navigate('/')} className="mt-2 text-sm text-fg-muted hover:text-fg underline cursor-pointer">
                Go back home
              </button>
            </div>
          )}

          <div className="bg-bg-card rounded-lg p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-fg mb-2">Join Room</h2>
            <p className="text-fg-muted text-sm mb-6">
              Enter your name to join room <span className="font-mono text-primary">{roomCode}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-fg-muted mb-2">Your Name</label>
                <input
                  type="text"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 bg-bg-input border border-border rounded-lg text-fg placeholder-fg-muted/50 focus:outline-none focus:border-primary transition-colors text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                  autoFocus
                  disabled={isJoining}
                />
              </div>

              <button
                onClick={handleJoinRoom}
                disabled={!joinName.trim() || isJoining}
                className="w-full py-3 bg-tertiary hover:bg-tertiary/80 disabled:bg-tertiary/50 text-fg font-medium rounded-lg transition-colors disabled:cursor-not-allowed cursor-pointer">
                {isJoining ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-fg/30 border-t-fg rounded-full animate-spin" />
                    Joining...
                  </span>
                ) : (
                  'Join Room'
                )}
              </button>

              <button
                onClick={() => navigate('/')}
                disabled={isJoining}
                className="w-full py-2 text-fg-muted hover:text-fg text-sm transition-colors disabled:opacity-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
