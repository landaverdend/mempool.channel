import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useWebSocket } from '../contexts/websocket-context';
import InvoiceRequestModal from '../components/InvoiceRequestModal';
import { RequestQueue } from '@/components/RequestQueue';

export default function Room() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const {
    connected,
    roomState,
    roomMessages,
    invoiceState,
    error,
    leaveRoom,
    closeRoom,
    makeRequest,
    sendRoomMessage,
    clearError,
    clearInvoice,
  } = useWebSocket();

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

  const copyRoomCode = () => {
    if (roomState.roomCode) {
      navigator.clipboard.writeText(roomState.roomCode);
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

  const handleLeave = () => {
    if (roomState.isHost) {
      closeRoom();
    } else {
      leaveRoom();
    }
    navigate('/');
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
      <div className="max-w-3xl mx-auto p-8">
        {/* Header */}
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

        {/* Request Queue */}

        <RequestQueue roomState={roomState} />
        {/* <div className="mb-4 p-4 bg-slate-800 rounded">
          <h2 className="text-lg font-semibold">Request Queue</h2>
          <ul className="space-y-2">
            {roomState.requestQueue.map((request) => (
              <li key={request.createdAt} className="text-sm">
                <span className="font-mono text-xs">{request.requesterId}</span> spent {request.amount} to listen to{' '}
                <a href={request.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">
                  {request.url}
                </a>
              </li>
            ))}
          </ul>
        </div> */}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={clearError} className="text-red-400 hover:text-red-200 ml-2">
              [dismiss]
            </button>
          </div>
        )}

        {/* Members */}
        <div className="mb-4 p-3 bg-slate-800 rounded">
          <p className="text-gray-400">
            <span className="font-semibold">{roomState.members.length}</span> member
            {roomState.members.length !== 1 && 's'} in room
          </p>
        </div>

        {/* Invoice Request */}
        <div className="mb-4 p-4 bg-slate-800 rounded">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Request Payment</h2>
            <button
              onClick={handleOpenModal}
              className="px-4 py-2 bg-blue-700 text-gray-100 rounded cursor-pointer hover:bg-blue-600 transition-colors">
              New Request
            </button>
          </div>

          {invoiceState.invoice && (
            <div className="mt-4 p-3 bg-slate-700 rounded">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">Invoice:</p>
                <button onClick={copyInvoice} className="text-xs text-indigo-400 hover:text-indigo-300">
                  Copy
                </button>
              </div>
              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="shrink-0 bg-white p-3 rounded">
                  <QRCodeSVG value={invoiceState.invoice} size={200} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs break-all text-green-400">{invoiceState.invoice}</p>
                </div>
              </div>
            </div>
          )}

          {invoiceState.error && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200">{invoiceState.error}</div>
          )}
        </div>

        {/* Room Chat */}
        <div className="p-4 bg-slate-800 rounded">
          <h2 className="text-lg font-semibold mb-3">Chat</h2>
          <div className="bg-slate-700 rounded p-3 mb-3">
            <ul className="max-h-64 overflow-y-auto space-y-2">
              {roomMessages.length === 0 ? (
                <li className="text-gray-500 text-sm">No messages yet</li>
              ) : (
                roomMessages.map((msg) => (
                  <li key={msg.id} className="text-sm">
                    <span className={`font-mono text-xs ${msg.isHost ? 'text-yellow-400' : 'text-indigo-400'}`}>
                      {msg.senderId}
                      {msg.isHost && ' (host)'}
                    </span>
                    <span className="text-gray-500 text-xs ml-2">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    <p className="text-gray-100">{String(msg.content)}</p>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 bg-slate-600 text-gray-100 rounded border border-slate-500 focus:border-indigo-500 focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
              className="px-4 py-2 bg-indigo-700 text-gray-100 rounded cursor-pointer hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Send
            </button>
          </div>
        </div>
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
