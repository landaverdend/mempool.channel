import { useState, useEffect, useCallback } from 'react';
import {
  createMessage,
  parseMessage,
  serializeMessage,
  Message,
  RoomCreatedPayload,
  RoomJoinedPayload,
  RoomClosedPayload,
  RoomErrorPayload,
  UserJoinedPayload,
  UserLeftPayload,
  RoomMessageReceivedPayload,
} from '@mempool/shared';
import MessageDebug from './components/message-debug';

interface RoomState {
  roomCode: string | null;
  isHost: boolean;
  members: string[];
}

interface RoomMessage {
  id: string;
  senderId: string;
  content: unknown;
  isHost: boolean;
  timestamp: number;
}

function App() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  // Room state
  const [roomState, setRoomState] = useState<RoomState>({
    roomCode: null,
    isHost: false,
    members: [],
  });
  const [roomMessages, setRoomMessages] = useState<RoomMessage[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');

  const connect = useCallback(() => {
    const socket = new WebSocket('ws://localhost:8080');

    socket.onopen = () => {
      setConnected(true);
      console.log('Connected to server');
    };

    socket.onmessage = (event) => {
      const message = parseMessage(event.data);
      if (!message) return;

      setMessages((prev) => [...prev, message]);

      // Handle room-specific messages
      switch (message.type) {
        case 'data': {
          const dataPayload = message.payload as { clientId?: string };
          if (dataPayload.clientId) {
            setClientId(dataPayload.clientId);
          }
          break;
        }

        case 'room-created': {
          const payload = message.payload as RoomCreatedPayload;
          setRoomState({
            roomCode: payload.roomCode,
            isHost: true,
            members: [clientId || ''],
          });
          setRoomMessages([]);
          setError(null);
          break;
        }

        case 'room-joined': {
          const payload = message.payload as RoomJoinedPayload;
          setRoomState({
            roomCode: payload.roomCode,
            isHost: payload.isHost,
            members: payload.members,
          });
          setRoomMessages([]);
          setError(null);
          break;
        }

        case 'room-left': {
          setRoomState({ roomCode: null, isHost: false, members: [] });
          setRoomMessages([]);
          break;
        }

        case 'room-closed': {
          const payload = message.payload as RoomClosedPayload;
          setRoomState({ roomCode: null, isHost: false, members: [] });
          setRoomMessages([]);
          const reasonText = payload.reason.replace(/_/g, ' ');
          setError(`Room closed: ${reasonText}`);
          break;
        }

        case 'user-joined': {
          const payload = message.payload as UserJoinedPayload;
          setRoomState((prev) => ({
            ...prev,
            members: [...prev.members, payload.clientId],
          }));
          break;
        }

        case 'user-left': {
          const payload = message.payload as UserLeftPayload;
          setRoomState((prev) => ({
            ...prev,
            members: prev.members.filter((id) => id !== payload.clientId),
          }));
          break;
        }

        case 'room-message': {
          const payload = message.payload as RoomMessageReceivedPayload;
          setRoomMessages((prev) => [
            ...prev,
            {
              id: message.id,
              senderId: payload.senderId,
              content: payload.content,
              isHost: payload.isHost,
              timestamp: message.timestamp,
            },
          ]);
          break;
        }

        case 'room-error': {
          const payload = message.payload as RoomErrorPayload;
          setError(payload.message);
          break;
        }
      }
    };

    socket.onclose = () => {
      setConnected(false);
      setRoomState({ roomCode: null, isHost: false, members: [] });
      setRoomMessages([]);
      console.log('Disconnected from server');
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setWs(socket);
  }, [clientId]);

  const disconnect = useCallback(() => {
    if (ws) {
      ws.close();
      setWs(null);
    }
  }, [ws]);

  const sendPing = useCallback(() => {
    if (ws && connected) {
      const message = createMessage('ping', { time: Date.now() });
      ws.send(serializeMessage(message));
    }
  }, [ws, connected]);

  const createRoom = useCallback(() => {
    if (ws && connected) {
      const message = createMessage('create-room', {});
      ws.send(serializeMessage(message));
    }
  }, [ws, connected]);

  const joinRoom = useCallback(() => {
    if (ws && connected && joinCode.trim()) {
      const message = createMessage('join-room', {
        roomCode: joinCode.trim().toUpperCase(),
      });
      ws.send(serializeMessage(message));
      setJoinCode('');
    }
  }, [ws, connected, joinCode]);

  const leaveRoom = useCallback(() => {
    if (ws && connected && roomState.roomCode) {
      const message = createMessage('leave-room', {
        roomCode: roomState.roomCode,
      });
      ws.send(serializeMessage(message));
    }
  }, [ws, connected, roomState.roomCode]);

  const closeRoom = useCallback(() => {
    if (ws && connected && roomState.roomCode && roomState.isHost) {
      const message = createMessage('close-room', {
        roomCode: roomState.roomCode,
      });
      ws.send(serializeMessage(message));
    }
  }, [ws, connected, roomState.roomCode, roomState.isHost]);

  const sendRoomMessage = useCallback(() => {
    if (ws && connected && roomState.roomCode && messageInput.trim()) {
      const message = createMessage('room-message', {
        roomCode: roomState.roomCode,
        content: messageInput.trim(),
      });
      ws.send(serializeMessage(message));
      setMessageInput('');
    }
  }, [ws, connected, roomState.roomCode, messageInput]);

  const copyRoomCode = useCallback(() => {
    if (roomState.roomCode) {
      navigator.clipboard.writeText(roomState.roomCode);
    }
  }, [roomState.roomCode]);

  useEffect(() => {
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [ws]);

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
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200 ml-2">
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
                onClick={createRoom}
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
                onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
              />
              <button
                onClick={joinRoom}
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
                  onKeyDown={(e) => e.key === 'Enter' && sendRoomMessage()}
                />
                <button
                  onClick={sendRoomMessage}
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
