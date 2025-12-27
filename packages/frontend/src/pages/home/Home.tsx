import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../../contexts/websocketContext';
import { useDemo } from '../../contexts/demoContext';
import Navbar from '../../components/Navbar';
import QRScannerModal from '../../components/QRScannerModal';
import AboutModal from '../../components/AboutModal';
import { JoinIcon, RightArrowIcon } from '@/components/Icons';

export default function Home() {
  const navigate = useNavigate();

  const { connected, createRoom, joinRoom, roomState, error: wsError, clearError } = useWebSocket();
  const { enterDemoMode, exitDemoMode } = useDemo();
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [joinCode, setJoinCode] = useState('');
  const [nwcUrl, setNwcUrl] = useState('');
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

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

    if (!name.trim()) {
      setLocalError('Please enter a room name');
      return;
    }

    setLocalError(null);
    clearError();
    setIsLoading(true);
    createRoom({ nwcUrl, name });
  };

  const handleJoinRoom = () => {
    if (!joinCode.trim()) {
      setLocalError('Please enter a room code');
      return;
    }

    if (!name.trim()) {
      setLocalError('Please enter a name');
      return;
    }

    setLocalError(null);
    clearError();
    setIsLoading(true);
    joinRoom({ roomCode: joinCode, name });
  };

  const resetToSelect = () => {
    setMode('select');
    setJoinCode('');
    setNwcUrl('');
    setLocalError(null);
    clearError();
  };

  const handleStartDemo = () => {
    exitDemoMode(); // Reset any existing demo state
    enterDemoMode();
    navigate('/room/DEMO42');
  };

  // Loading/connecting state
  if (!connected) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-6">
            <span className="text-3xl sm:text-4xl font-bold text-fg">mempool</span>
            <span className="text-3xl sm:text-4xl font-bold text-tertiary">.channel</span>
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
                Welcome to mempool<span className="text-title-purple">.channel</span>
              </h1>
              <div className="flex flex-col items-center justify-between">
                <p className="text-fg-muted text-sm sm:text-base mb-8">
                  Host a listening party or join an existing room to queue songs with Lightning payments.
                  <button
                    onClick={() => setIsAboutOpen(true)}
                    className="text-link hover:text-info transition-colors cursor-pointer hover:underline ml-1">
                    Read More
                  </button>
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => setMode('create')}
                  className="w-full flex items-center justify-between p-4 bg-bg-stat hover:bg-secondary/50 rounded-lg transition-colors group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-700/40 flex items-center justify-center">
                      <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-fg">Host a Room</div>
                      <div className="text-sm text-fg-muted">Connect your wallet and share the code</div>
                    </div>
                  </div>
                  <RightArrowIcon />
                </button>

                <button
                  onClick={() => setMode('join')}
                  className="w-full flex items-center justify-between p-4 bg-bg-stat hover:bg-secondary/50 rounded-lg transition-colors group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <JoinIcon className="ml-1" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-fg">Join a Room</div>
                      <div className="text-sm text-fg-muted">Enter a 6-character room code</div>
                    </div>
                  </div>
                  <RightArrowIcon />
                </button>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-bg-card px-2 text-fg-muted">or</span>
                  </div>
                </div>

                <button
                  onClick={handleStartDemo}
                  className="w-full flex items-center justify-between p-4 bg-bg-stat hover:bg-secondary/50 border border-dashed border-tertiary/30 rounded-lg transition-colors group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-tertiary/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-fg">Try Demo</div>
                      <div className="text-sm text-fg-muted">Explore the app with simulated activity</div>
                    </div>
                  </div>
                  <RightArrowIcon />
                </button>
              </div>
            </div>
          )}

          {/* Mode: Create */}
          {mode === 'create' && (
            <div className="bg-bg-card rounded-lg p-6 sm:p-8">
              <BackButton onClick={resetToSelect} disabled={isLoading} />

              <h2 className="text-xl font-semibold text-fg mb-2">Host a Room</h2>
              <p className="text-fg-muted text-sm mb-6">
                Connect your Nostr Wallet Connect (NWC) to receive payments from listeners.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-fg-muted mb-2">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Chuck McDuck"
                    className="w-full px-4 py-3 bg-bg-input border border-border rounded-lg text-fg placeholder-fg-muted/50 focus:outline-none focus:border-primary transition-colors text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
                    autoFocus
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-fg-muted mb-2">NWC Connection String</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={nwcUrl}
                      onChange={(e) => setNwcUrl(e.target.value)}
                      placeholder="nostr+walletconnect://..."
                      className="flex-1 px-4 py-3 bg-bg-input border border-border rounded-lg text-fg placeholder-fg-muted/50 focus:outline-none focus:border-primary transition-colors text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setIsScannerOpen(true)}
                      disabled={isLoading}
                      className="px-4 py-3 bg-bg-input border border-border rounded-lg text-fg-muted hover:text-fg hover:border-primary transition-colors disabled:opacity-50 cursor-pointer"
                      title="Scan QR Code">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                        />
                      </svg>
                    </button>
                  </div>
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
            <div className="bg-bg-card rounded-lg p-6 sm:p-8">
              <BackButton onClick={resetToSelect} disabled={isLoading} />

              <h2 className="text-xl font-semibold text-fg mb-2">Join a Room</h2>
              <p className="text-fg-muted text-sm mb-6">Enter the 6-character code shared by the host.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-fg-muted mb-2">Your Name </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Chuck McDuck"
                    className="w-full px-4 py-3 bg-bg-input border border-border rounded-lg text-fg placeholder-fg-muted/50 focus:outline-none focus:border-primary transition-colors text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
                    autoFocus
                    disabled={isLoading}
                  />
                </div>

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
          <p className="text-center text-fg-muted/50 text-xs mt-6">
            Powered by Lightning Network ⚡ <span className="mx-1">·</span>
            <button
              onClick={() => setIsAboutOpen(true)}
              className="text-fg-muted/50 hover:text-fg-muted transition-colors cursor-pointer">
              About
            </button>
          </p>
        </div>
      </main>

      {/* Modals */}
      <QRScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScan={(result) => setNwcUrl(result)} />
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
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
