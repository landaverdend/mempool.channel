import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../../contexts/websocket-context';
import Navbar from '../../components/Navbar';

export default function Home() {
  const navigate = useNavigate();

  const { connected, createRoom, joinRoom, roomState, error: wsError, clearError } = useWebSocket();
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [joinCode, setJoinCode] = useState('');
  const [nwcUrl, setNwcUrl] = useState('');
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
    if (!nwcUrl) {
      setLocalError('Please enter an NWC connection string');
      return;
    }

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

  const resetToSelect = () => {
    setMode('select');
    setJoinCode('');
    setNwcUrl('');
    setLocalError(null);
    clearError();
  };

  // Loading/connecting state
  if (!connected) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-6">
            <span className="text-3xl sm:text-4xl font-bold text-fg">mempool</span>
            <span className="text-3xl sm:text-4xl font-bold text-tertiary">.band</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-fg-muted">
            <div className="w-2 h-2 bg-tertiary rounded-full animate-pulse" />
            <span>Connecting to server...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar />

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Error display */}
          {error && (
            <div className="mb-4 p-4 bg-red/10 border border-red/30 rounded-lg">
              <p className="text-red text-sm">{error}</p>
            </div>
          )}

          {/* Mode: Select */}
          {mode === 'select' && (
            <div className="bg-bg-card rounded-lg p-6 sm:p-8">
              <h1 className="text-xl sm:text-2xl font-semibold text-fg mb-2">
                Welcome to mempool<span className="text-title-purple">.band</span>
              </h1>
              <p className="text-fg-muted text-sm sm:text-base mb-8">
                Host a listening party or join an existing room to queue songs with Lightning payments.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => setMode('create')}
                  className="w-full flex items-center justify-between p-4 bg-bg-stat hover:bg-secondary/50 border border-border rounded-lg transition-colors group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-fg">Host a Room</div>
                      <div className="text-sm text-fg-muted">Connect your wallet and share the code</div>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-fg-muted group-hover:text-fg transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={() => setMode('join')}
                  className="w-full flex items-center justify-between p-4 bg-bg-stat hover:bg-secondary/50 border border-border rounded-lg transition-colors group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-fg">Join a Room</div>
                      <div className="text-sm text-fg-muted">Enter a 6-character room code</div>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-fg-muted group-hover:text-fg transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Mode: Create */}
          {mode === 'create' && (
            <div className="bg-bg-box border border-border rounded-lg p-6 sm:p-8">
              <BackButton onClick={resetToSelect} disabled={isLoading} />

              <h2 className="text-xl font-semibold text-fg mb-2">Host a Room</h2>
              <p className="text-fg-muted text-sm mb-6">
                Connect your Nostr Wallet Connect (NWC) to receive payments from listeners.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-fg-muted mb-2">NWC Connection String</label>
                  <input
                    type="text"
                    value={nwcUrl}
                    onChange={(e) => setNwcUrl(e.target.value)}
                    placeholder="nostr+walletconnect://..."
                    className="w-full px-4 py-3 bg-bg-input border border-border rounded-lg text-fg placeholder-fg-muted/50 focus:outline-none focus:border-primary transition-colors text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
                    autoFocus
                    disabled={isLoading}
                  />
                  <p className="mt-2 text-xs text-fg-muted">Get this from your NWC-compatible wallet (Alby, Mutiny, etc.)</p>
                </div>

                <button
                  onClick={handleCreateRoom}
                  disabled={isLoading || !nwcUrl}
                  className="w-full py-3 bg-success hover:bg-success/80 disabled:bg-success/50 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed cursor-pointer ">
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating Room...
                    </span>
                  ) : (
                    'Create Room'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Mode: Join */}
          {mode === 'join' && (
            <div className="bg-bg-box border border-border rounded-lg p-6 sm:p-8">
              <BackButton onClick={resetToSelect} disabled={isLoading} />

              <h2 className="text-xl font-semibold text-fg mb-2">Join a Room</h2>
              <p className="text-fg-muted text-sm mb-6">Enter the 6-character code shared by the host.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-fg-muted mb-2">Room Code</label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    placeholder="ABC123"
                    maxLength={6}
                    className="w-full px-4 py-4 bg-bg-input border border-border rounded-lg text-fg text-center font-mono text-2xl sm:text-3xl tracking-[0.3em] uppercase placeholder-fg-muted/30 focus:outline-none focus:border-primary transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && joinCode.length === 6 && handleJoinRoom()}
                    autoFocus
                    disabled={isLoading}
                  />
                </div>

                <button
                  onClick={handleJoinRoom}
                  disabled={joinCode.length !== 6 || isLoading}
                  className="w-full py-3 bg-tertiary hover:bg-tertiary/80 disabled:bg-tertiary/50 text-fg font-medium rounded-lg transition-colors disabled:cursor-not-allowed cursor-pointer">
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-fg/30 border-t-fg rounded-full animate-spin" />
                      Joining...
                    </span>
                  ) : (
                    'Join Room'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Footer info */}
          <p className="text-center text-fg-muted/50 text-xs mt-6">Powered by Lightning Network ⚡</p>
        </div>
      </main>
    </div>
  );
}

type BackButtonProps = {
  onClick: () => void;
  disabled: boolean;
};
function BackButton({ onClick, disabled }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 text-fg-muted hover:text-fg transition-colors mb-6 disabled:opacity-50 cursor-pointer">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      <span className="text-sm">Back</span>
    </button>
  );
}
