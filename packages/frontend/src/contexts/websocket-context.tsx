import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
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
  CreateRoomPayload,
  MakeRequestPayload,
} from '@mempool/shared';

// Types
export interface RoomState {
  roomCode: string | null;
  isHost: boolean;
  members: string[];
  hostLightningAddress: string;
}

export interface RoomMessage {
  id: string;
  senderId: string;
  content: unknown;
  isHost: boolean;
  timestamp: number;
}

interface WebSocketContextValue {
  // Connection state
  connected: boolean;
  clientId: string | null;
  messages: Message[];
  error: string | null;

  // Room state
  roomState: RoomState;
  roomMessages: RoomMessage[];

  // Connection actions
  connect: () => void;
  disconnect: () => void;
  sendPing: () => void;

  // Room actions
  createRoom: (payload: CreateRoomPayload) => void;
  makeRequest: (payload: MakeRequestPayload) => void;
  joinRoom: (roomCode: string) => void;
  leaveRoom: () => void;
  closeRoom: () => void;
  sendRoomMessage: (content: string) => void;

  // Utility actions
  clearError: () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

const WEBSOCKET_URL = 'ws://localhost:8080';

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [roomState, setRoomState] = useState<RoomState>({
    roomCode: null,
    isHost: false,
    members: [],
    hostLightningAddress: '',
  });
  const [roomMessages, setRoomMessages] = useState<RoomMessage[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const clientIdRef = useRef<string | null>(null);

  // Keep clientIdRef in sync
  useEffect(() => {
    clientIdRef.current = clientId;
  }, [clientId]);

  const handleMessage = useCallback((event: MessageEvent) => {
    const message = parseMessage(event.data);
    if (!message) return;

    setMessages((prev) => [...prev, message]);

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
          members: [clientIdRef.current || ''],
          hostLightningAddress: payload.hostLightningAddress,
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
          hostLightningAddress: payload.hostLightningAddress,
        });
        setRoomMessages([]);
        setError(null);
        break;
      }

      case 'room-left': {
        setRoomState({ roomCode: null, isHost: false, members: [], hostLightningAddress: '' });
        setRoomMessages([]);
        break;
      }

      case 'room-closed': {
        const payload = message.payload as RoomClosedPayload;
        setRoomState({ roomCode: null, isHost: false, members: [], hostLightningAddress: '' });
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
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const socket = new WebSocket(WEBSOCKET_URL);

    socket.onopen = () => {
      setConnected(true);
      console.log('Connected to server');
    };

    socket.onmessage = handleMessage;

    socket.onclose = () => {
      setConnected(false);
      setClientId(null);
      setRoomState({ roomCode: null, isHost: false, members: [], hostLightningAddress: '' });
      setRoomMessages([]);
      wsRef.current = null;
      console.log('Disconnected from server');
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error');
    };

    wsRef.current = socket;
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((type: Parameters<typeof createMessage>[0], payload: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = createMessage(type, payload);
      wsRef.current.send(serializeMessage(message));
    }
  }, []);

  const sendPing = useCallback(() => {
    sendMessage('ping', { time: Date.now() });
  }, [sendMessage]);

  const makeRequest = useCallback(
    (requestPayload: MakeRequestPayload) => {
      sendMessage('make-request', requestPayload);
    },
    [sendMessage]
  );

  const createRoom = useCallback(
    (createRoomPayload: CreateRoomPayload) => {
      sendMessage('create-room', createRoomPayload);
    },
    [sendMessage]
  );

  const joinRoom = useCallback(
    (roomCode: string) => {
      sendMessage('join-room', { roomCode: roomCode.trim().toUpperCase() });
    },
    [sendMessage]
  );

  const leaveRoom = useCallback(() => {
    if (roomState.roomCode) {
      sendMessage('leave-room', { roomCode: roomState.roomCode });
    }
  }, [sendMessage, roomState.roomCode]);

  const closeRoom = useCallback(() => {
    if (roomState.roomCode && roomState.isHost) {
      sendMessage('close-room', { roomCode: roomState.roomCode });
    }
  }, [sendMessage, roomState.roomCode, roomState.isHost]);

  const sendRoomMessage = useCallback(
    (content: string) => {
      if (roomState.roomCode && content.trim()) {
        sendMessage('room-message', {
          roomCode: roomState.roomCode,
          content: content.trim(),
        });
      }
    },
    [sendMessage, roomState.roomCode]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const value: WebSocketContextValue = {
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
    makeRequest,
    closeRoom,
    sendRoomMessage,
    clearError,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
