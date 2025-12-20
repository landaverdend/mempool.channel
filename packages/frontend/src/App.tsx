import { useState } from 'react';
import { useWebSocket } from './contexts/websocket-context';
import MessageDebug from './components/message-debug';

function App() {
  const {
    connected,
    clientId,
    messages,
    error,
    roomState,
    roomMessages,
    connect,
    disconnect,
    sendPing,
    createRoom,
    joinRoom,
    leaveRoom,
    closeRoom,
    sendRoomMessage,
    clearError,
  } = useWebSocket();

  const [joinCode, setJoinCode] = useState('');
  const [messageInput, setMessageInput] = useState('');

  const handleJoinRoom = () => {
    if (joinCode.trim()) {
      joinRoom(joinCode);
      setJoinCode('');
    }
  };

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

  const handleCreateRoom = () => {
    const lightningAddress = prompt('Enter lightning address to send to:');

    if (!lightningAddress) return;

    createRoom({ lightningAddress });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-gray-100 font-sans">
      <div className="max-w-3xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4">mempool.band</h1>

        {/* Connection Status */}
        <div className="mb-4 p-3 bg-slate-800 rounded flex items-center justify-between">
          <div>
            Status: {connected ? 'Connected' : 'Disconnected'}
            {clientId && connected && <span className="ml-4 text-sm text-gray-400">ID: {clientId}</span>}
          </div>
          <div className="flex gap-2">
            {!connected ? (
              <button
                onClick={connect}
                className="px-4 py-2 bg-indigo-900 text-gray-100 rounded cursor-pointer hover:bg-indigo-700 transition-colors">
                Connect
              </button>
            ) : (
              <>
                <button
                  onClick={sendPing}
                  className="px-4 py-2 bg-indigo-900 text-gray-100 rounded cursor-pointer hover:bg-indigo-700 transition-colors">
                  Ping
                </button>
                <button
                  onClick={disconnect}
                  className="px-4 py-2 bg-slate-700 text-gray-100 rounded cursor-pointer hover:bg-slate-600 transition-colors">
                  Disconnect
                </button>
              </>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={clearError} className="text-red-400 hover:text-red-200 ml-2">
              [dismiss]
            </button>
          </div>
        )}

        {/* Room Controls - when not in a room */}
        {!roomState.roomCode && connected && (
          <div className="mb-4 p-4 bg-slate-800 rounded">
            <h2 className="text-xl font-semibold mb-3">Room Controls</h2>
            <div className="flex gap-2 mb-3">
              <button
                onClick={handleCreateRoom}
                className="px-4 py-2 bg-green-700 text-gray-100 rounded cursor-pointer hover:bg-green-600 transition-colors">
                Create Room
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter room code"
                maxLength={6}
                className="px-3 py-2 bg-slate-700 text-gray-100 rounded border border-slate-600 focus:border-indigo-500 focus:outline-none uppercase tracking-wider font-mono"
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
              />
              <button
                onClick={handleJoinRoom}
                disabled={!joinCode.trim()}
                className="px-4 py-2 bg-indigo-700 text-gray-100 rounded cursor-pointer hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Join Room
              </button>
            </div>
          </div>
        )}

        {/* Room Info - when in a room */}
        {roomState.roomCode && (
          <div className="mb-4 p-4 bg-slate-800 rounded">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                Room:
                <span
                  className="font-mono text-indigo-400 cursor-pointer hover:text-indigo-300"
                  onClick={copyRoomCode}
                  title="Click to copy">
                  {roomState.roomCode}
                </span>
                {roomState.isHost && <span className="text-sm bg-yellow-600 px-2 py-1 rounded font-normal">HOST</span>}
              </h2>
              <div className="flex gap-2">
                {roomState.isHost ? (
                  <button
                    onClick={closeRoom}
                    className="px-4 py-2 bg-red-700 text-gray-100 rounded cursor-pointer hover:bg-red-600 transition-colors">
                    Close Room
                  </button>
                ) : (
                  <button
                    onClick={leaveRoom}
                    className="px-4 py-2 bg-orange-700 text-gray-100 rounded cursor-pointer hover:bg-orange-600 transition-colors">
                    Leave Room
                  </button>
                )}
              </div>
            </div>
            <p className="text-gray-400 mb-3">Members: {roomState.members.length}</p>

            {/* Room Messages */}
            <div className="bg-slate-700 rounded p-3 mb-3">
              <h3 className="text-sm font-semibold mb-2 text-gray-400">Room Chat</h3>
              <ul className="max-h-48 overflow-y-auto space-y-2 mb-3">
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
        )}

        {/* Debug Messages */}
        <MessageDebug messages={messages} />
      </div>
    </div>
  );
}

export default App;
