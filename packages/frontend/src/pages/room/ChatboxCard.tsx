import { useState, useRef, useEffect } from 'react';
import { useRoom } from '@/hooks/useRoom';
import { RoomMessage } from '@/contexts/websocketContext';

export default function ChatboxCard() {
  const { roomMessages, sendRoomMessage, clientId } = useRoom();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!messagesContainerRef.current) return;
    const container = messagesContainerRef.current;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }, [roomMessages]);

  const handleSend = () => {
    if (message.trim()) {
      sendRoomMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const truncateId = (id: string) => {
    if (id.length <= 15) return id;
    return `${id.slice(0, 4)}...${id.slice(-4)}`;
  };

  return (
    <div className="bg-bg-card rounded-sm p-4 flex flex-col h-[400px]">
      <h2 className="text-lg font-semibold text-fg mb-3">Chat</h2>

      {/* Messages Container */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1">
        {roomMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-fg-muted text-sm">No messages yet</p>
          </div>
        ) : (
          roomMessages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === clientId}
              formatTime={formatTime}
              truncateId={truncateId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex gap-2 min-w-0">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 min-w-0 px-3 py-2 bg-bg-input text-fg text-sm rounded border border-border focus:border-primary focus:outline-none placeholder:text-fg-muted/50 transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="px-3 sm:px-4 py-2 bg-tertiary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer rounded-md shrink-0">
          Send
        </button>
      </div>
    </div>
  );
}

interface ChatMessageProps {
  message: RoomMessage;
  isOwn: boolean;
  formatTime: (timestamp: number) => string;
  truncateId: (id: string) => string;
}
function ChatMessage({ message, isOwn, formatTime, truncateId }: ChatMessageProps) {
  return (
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
      {/* Header: Sender ID, Host Badge, Timestamp */}
      <div className="flex items-center gap-2 mb-0.5">
        <span className={`text-xs font-mono ${isOwn ? 'text-primary' : 'text-fg-muted'}`}>{truncateId(message.senderName)}</span>
        {message.isHost && <span className="text-[10px] px-1.5 py-0.5 bg-mainnet/20 text-mainnet rounded font-medium">HOST</span>}
        <span className="text-[10px] text-fg-muted/60">{formatTime(message.timestamp)}</span>
      </div>

      {/* Message Content */}
      <div
        className={`max-w-[60%] px-3 py-2 rounded-lg text-sm wrap-break-word ${
          isOwn ? 'bg-primary/80 text-fg' : 'bg-secondary text-fg'
        }`}>
        {String(message.content)}
      </div>
    </div>
  );
}
