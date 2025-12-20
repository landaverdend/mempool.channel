import { useState, useEffect, useCallback } from 'react';
import { createMessage, parseMessage, serializeMessage, Message } from '@mempool/shared';

function App() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const connect = useCallback(() => {
    const socket = new WebSocket('ws://localhost:8080');

    socket.onopen = () => {
      setConnected(true);
      console.log('Connected to server');
    };

    socket.onmessage = (event) => {
      const message = parseMessage(event.data);
      if (message) {
        setMessages((prev) => [...prev, message]);
      }
    };

    socket.onclose = () => {
      setConnected(false);
      console.log('Disconnected from server');
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setWs(socket);
  }, []);

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
      setMessages((prev) => [...prev, message]);
    }
  }, [ws, connected]);

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
        <h1 className="text-3xl font-bold mb-4">Mempool Band</h1>
        <div className="mb-4 p-3 bg-slate-800 rounded">
          Status: {connected ? 'Connected' : 'Disconnected'}
        </div>
        <div className="flex gap-2 mb-4">
          {!connected ? (
            <button
              onClick={connect}
              className="px-4 py-2 bg-indigo-900 text-gray-100 rounded cursor-pointer hover:bg-rose-600 transition-colors"
            >
              Connect
            </button>
          ) : (
            <>
              <button
                onClick={sendPing}
                className="px-4 py-2 bg-indigo-900 text-gray-100 rounded cursor-pointer hover:bg-rose-600 transition-colors"
              >
                Send Ping
              </button>
              <button
                onClick={disconnect}
                className="px-4 py-2 bg-indigo-900 text-gray-100 rounded cursor-pointer hover:bg-rose-600 transition-colors"
              >
                Disconnect
              </button>
            </>
          )}
        </div>
        <div className="bg-slate-800 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Messages</h2>
          <ul className="max-h-96 overflow-y-auto">
            {messages.map((msg) => (
              <li
                key={msg.id}
                className="p-2 border-b border-slate-700 last:border-b-0 font-mono text-sm"
              >
                [{msg.type}] {JSON.stringify(msg.payload)} - {new Date(msg.timestamp).toLocaleTimeString()}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
