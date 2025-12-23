import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWebSocket } from '../../contexts/websocketContext';
import InvoiceRequestModal from '../../components/InvoiceRequestModal';
import { RequestQueue } from '@/components/RequestQueue';
import RoomHeader from '@/pages/room/RoomHeader';
import NowPlayingCard from '@/pages/room/NowPlayingCard';
import HostUploadCard from '@/pages/room/HostUploadCard';
import RequestSongCard from '@/pages/room/RequestSongCard';
import ChatboxCard from './ChatboxCard';

export default function Room() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { connected, roomState, invoiceState, error, makeRequest, sendRoomMessage, clearError, clearInvoice } = useWebSocket();

  const [messageInput, setMessageInput] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Redirect to home if not in this room
  useEffect(() => {
    if (!roomState.roomCode) {
      navigate('/');
    } else if (roomState.roomCode !== roomCode) {
      navigate(`/room/${roomState.roomCode}`);
    }
  }, [roomState.roomCode, roomCode, navigate]);

  // Close modal when invoice is generated
  useEffect(() => {
    if (invoiceState.invoice && !invoiceState.loading) {
      setShowInvoiceModal(false);
    }
  }, [invoiceState.invoice, invoiceState.loading]);

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      sendRoomMessage(messageInput);
      setMessageInput('');
    }
  };

  const copyInvoice = () => {
    if (invoiceState.invoice) {
      navigator.clipboard.writeText(invoiceState.invoice);
    }
  };

  const handleRequestPayment = (amount: number, url: string, comment?: string) => {
    if (!roomState.roomCode) return;
    makeRequest({ roomCode: roomState.roomCode, amount, comment, url });
  };

  const handleOpenModal = () => {
    clearInvoice();
    setShowInvoiceModal(true);
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-slate-900 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Reconnecting...</p>
        </div>
      </div>
    );
  }

  if (!roomState.roomCode) {
    return null; // Will redirect via useEffect
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

        <div className="bg-bg-card rounded-sm p-4">
          <h2 className="text-lg font-semibold ">Song Queue</h2>
        </div>

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
