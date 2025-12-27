import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useRoom } from '@/hooks/useRoom';
import InvoiceRequestModal from '../../components/InvoiceRequestModal';
import { RequestQueue } from '@/components/RequestQueue';
import RoomHeader from '@/pages/room/RoomHeader';
import NowPlayingCard from '@/pages/room/NowPlayingCard';
import HostUploadCard from '@/pages/room/HostUploadCard';
import RequestSongCard from '@/pages/room/RequestSongCard';
import ChatboxCard from './ChatboxCard';
import SongQueueCard from './SongQueueCard';
import JoinRoomForm from './JoinRoomForm';

export default function Room() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const { isDemoMode, connected, roomState, invoiceState, error, makeRequest, clearError } = useRoom();

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Check if we need to show the join form (local state not in sync with server)
  // In demo mode, we never need to join
  const needsToJoin = !isDemoMode && roomCode && !roomState.roomCode;

  // Close modal when invoice is generated
  useEffect(() => {
    if (invoiceState.invoice && !invoiceState.loading) {
      setShowInvoiceModal(false);
    }
  }, [invoiceState.invoice, invoiceState.loading]);

  const handleRequestPayment = (amount: number, url: string, comment?: string) => {
    if (!roomState.roomCode) return;
    makeRequest({ roomCode: roomState.roomCode, amount, comment, url });
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-bg text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-4 h-4 border-2 border-fg/30 border-t-fg rounded-full animate-spin mx-auto mb-2" />
          <p className="text-fg-muted">Connecting...</p>
        </div>
      </div>
    );
  }

  // Show join form if user needs to join
  if (needsToJoin) {
    return <JoinRoomForm />;
  }

  if (!roomState.roomCode) {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg text-gray-100">
      <RoomHeader roomState={roomState} />

      <RequestQueue roomState={roomState} />

      <div className="max-w-5xl mx-auto p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={clearError} className="text-red-400 hover:text-red-200 ml-2">
              [dismiss]
            </button>
          </div>
        )}

        <NowPlayingCard
          currentlyPlaying={roomState.currentlyPlaying}
          isHost={roomState.isHost}
          hasQueue={roomState.requestQueue.length > 0}
        />

        <RequestSongCard />

        <SongQueueCard />

        <ChatboxCard />

        {roomState.isHost && <HostUploadCard />}
      </div>

      {/* Invoice Request Modal */}
      <InvoiceRequestModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        onSubmit={handleRequestPayment}
        isLoading={invoiceState.loading}
      />
    </div>
  );
}
