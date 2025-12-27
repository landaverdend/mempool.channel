import { useState, useRef, useEffect } from 'react';
import { useRoom } from '@/hooks/useRoom';
import { ClientRoomInfo } from '@mempool/shared';
import Navbar from '../../components/Navbar';

type RoomHeaderProps = {
  roomState: ClientRoomInfo;
};

export default function RoomHeader({ roomState }: RoomHeaderProps) {
  const { leaveRoom, closeRoom, isDemoMode } = useRoom();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    // Navigation is handled inside leaveRoom/closeRoom
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <Navbar>
      {/* Desktop view */}
      <div className="hidden sm:flex items-center gap-4">
        <div className="flex items-center gap-2">
          {isDemoMode && (
            <span className="text-xs bg-gradient-to-r from-tertiary to-primary text-white px-2 py-0.5 rounded font-semibold animate-pulse">
              DEMO
            </span>
          )}
          <span
            className="font-mono text-lg text-link cursor-pointer hover:text-info transition-colors"
            onClick={copyRoomCode}
            title="Click to copy room code">
            {roomState.roomCode}
          </span>
          {roomState.isHost && <span className="text-xs bg-tertiary text-white px-2 py-0.5 rounded font-semibold">HOST</span>}
        </div>

        <div className="flex items-center gap-2 text-sm text-fg-muted">
          <span>{roomState.members.length}</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M15 14c2.67 0 8 1.33 8 4v2H7v-2c0-2.67 5.33-4 8-4zm-9-1c-2.67 0-8 1.34-8 4v2h6v-2c0-1.53.8-2.84 2.01-3.88A9 9 0 0 0 6 13zm9-5a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
          </svg>
        </div>

        <button
          onClick={handleLeave}
          className={`px-3 py-1.5 rounded text-sm font-medium cursor-pointer transition-colors ${
            roomState.isHost ? 'bg-red text-fg hover:opacity-80' : 'bg-secondary text-fg hover:bg-border'
          }`}>
          {roomState.isHost ? 'Close Room' : 'Leave'}
        </button>
      </div>

      {/* Mobile view */}
      <div className="sm:hidden relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded text-fg cursor-pointer">
          <span className="font-mono text-sm text-link">{roomState.roomCode}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`w-4 h-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`}>
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-bg-box border border-border rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-fg-muted">Room Code</span>
                <div className="flex items-center gap-1">
                  {isDemoMode && (
                    <span className="text-xs bg-gradient-to-r from-tertiary to-primary text-white px-2 py-0.5 rounded font-semibold animate-pulse">
                      DEMO
                    </span>
                  )}
                  {roomState.isHost && (
                    <span className="text-xs bg-tertiary text-white px-2 py-0.5 rounded font-semibold">HOST</span>
                  )}
                </div>
              </div>
              <button
                onClick={copyRoomCode}
                className="font-mono text-lg text-link hover:text-info transition-colors cursor-pointer">
                {roomState.roomCode}
              </button>
            </div>

            <div className="p-3 border-b border-border flex items-center justify-between">
              <span className="text-sm text-fg-muted">Members</span>
              <div className="flex items-center gap-2 text-fg">
                <span>{roomState.members.length}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M15 14c2.67 0 8 1.33 8 4v2H7v-2c0-2.67 5.33-4 8-4zm-9-1c-2.67 0-8 1.34-8 4v2h6v-2c0-1.53.8-2.84 2.01-3.88A9 9 0 0 0 6 13zm9-5a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                </svg>
              </div>
            </div>

            <div className="p-3">
              <button
                onClick={handleLeave}
                className={`w-full px-3 py-2 rounded text-sm font-medium cursor-pointer transition-colors ${
                  roomState.isHost ? 'bg-red text-fg hover:opacity-80' : 'bg-secondary text-fg hover:bg-border'
                }`}>
                {roomState.isHost ? 'Close Room' : 'Leave Room'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Navbar>
  );
}
