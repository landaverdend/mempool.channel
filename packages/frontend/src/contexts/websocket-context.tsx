import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import {
  createMessage,
  parseMessage,
  serializeMessage,
  Message,
  RoomCreatedPayload,
  RoomClosedPayload,
  RoomErrorPayload,
  UserJoinedPayload,
  UserLeftPayload,
  RoomMessageReceivedPayload,
  CreateRoomPayload,
  MakeRequestPayload,
  InvoiceGeneratedPayload,
  InvoiceErrorPayload,
  ClientRoomInfo,
} from '@mempool/shared';

export interface RoomMessage {
  id: string;
  senderId: string;
  content: unknown;
  isHost: boolean;
  timestamp: number;
}

export interface InvoiceState {
  invoice: string | null; // BOLT11 payment request
  loading: boolean;
  error: string | null;
}

const EMPTY_ROOM_STATE: ClientRoomInfo = {
  roomCode: '',
  isHost: false,
  members: [],
  requestQueue: [],
};

interface WebSocketContextValue {
  // Connection state
  connected: boolean;
  clientId: string | null;
  messages: Message[];
  error: string | null;

  // Room state
  roomState: ClientRoomInfo;
  roomMessages: RoomMessage[];

  // Invoice state
  invoiceState: InvoiceState;

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
  clearInvoice: () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

const WEBSOCKET_URL = 'ws://localhost:8080';

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [roomState, setRoomState] = useState<ClientRoomInfo>(EMPTY_ROOM_STATE);
  const [roomMessages, setRoomMessages] = useState<RoomMessage[]>([]);
  const [invoiceState, setInvoiceState] = useState<InvoiceState>({
    invoice: null,
    loading: false,
    error: null,
  });

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

      case 'room-created':
      case 'room-joined': {
        const payload = message.payload as RoomCreatedPayload;
        setRoomState({ ...payload });
        setRoomMessages([]);
        setError(null);
        break;
      }

      case 'room-left': {
        setRoomState(EMPTY_ROOM_STATE);
        setRoomMessages([]);
        break;
      }

      case 'room-closed': {
        const payload = message.payload as RoomClosedPayload;
        setRoomState(EMPTY_ROOM_STATE);
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

      case 'invoice-generated': {
        const payload = message.payload as InvoiceGeneratedPayload;
        setInvoiceState({
          invoice: payload.invoice.pr,
          loading: false,
          error: null,
        });
        break;
      }

      case 'invoice-error': {
        const payload = message.payload as InvoiceErrorPayload;
        setInvoiceState({
          invoice: null,
          loading: false,
          error: payload.error,
        });
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
      setRoomState(EMPTY_ROOM_STATE);
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
      setInvoiceState({ invoice: null, loading: true, error: null });
      sendMessage('make-request', requestPayload);
    },
    [sendMessage]
  );

  const clearInvoice = useCallback(() => {
    setInvoiceState({ invoice: null, loading: false, error: null });
  }, []);

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
    invoiceState,
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
    clearInvoice,
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
