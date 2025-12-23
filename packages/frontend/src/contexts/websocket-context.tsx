import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { toast } from 'sonner';
import {
  createMessage,
  parseMessage,
  serializeMessage,
  Message,
  RoomClosedPayload,
  RoomErrorPayload,
  UserJoinedPayload,
  UserLeftPayload,
  RoomMessageReceivedPayload,
  CreateRoomPayload,
  MakeRequestPayload,
  InvoiceGeneratedPayload,
  ClientRoomInfo,
} from '@mempool/shared';
import { MOCK_ROOM_STATE, MOCK_ROOM_MESSAGES } from '@/lib/mock-data';

// Dev mode: enable with ?dev query param or VITE_DEV_MODE env var
const isDevMode = () => {
  if (typeof window !== 'undefined') {
    return new URLSearchParams(window.location.search).has('dev');
  }
  return false;
};

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
  paid: boolean;
}

const EMPTY_ROOM_STATE: ClientRoomInfo = {
  roomCode: '',
  isHost: false,
  members: [],
  currentlyPlaying: null,
  playedRequests: [],
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

  // Playback actions (host only)
  playNext: () => void;
  addRequest: (url: string, amount: number) => void; // Debug / Host only

  // Utility actions
  clearError: () => void;
  clearInvoice: () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

const WEBSOCKET_URL = 'ws://localhost:8080';

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [devMode] = useState(isDevMode);
  const [connected, setConnected] = useState(devMode);
  const [messages, setMessages] = useState<Message[]>([]);
  const [clientId, setClientId] = useState<string | null>(devMode ? 'dev_client_123' : null);
  const [error, setError] = useState<string | null>(null);

  const [roomState, setRoomState] = useState<ClientRoomInfo>(devMode ? MOCK_ROOM_STATE : EMPTY_ROOM_STATE);
  const [roomMessages, setRoomMessages] = useState<RoomMessage[]>(devMode ? MOCK_ROOM_MESSAGES : []);
  const [invoiceState, setInvoiceState] = useState<InvoiceState>({
    invoice: null,
    loading: false,
    paid: false,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const clientIdRef = useRef<string | null>(null);

  // Log dev mode status
  useEffect(() => {
    if (devMode) {
      console.log('%c[DEV MODE] Using mock data', 'color: #00ff00; font-weight: bold');
    }
  }, [devMode]);

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
        const payload = message.payload as ClientRoomInfo;
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
          paid: false,
        });
        break;
      }

      case 'item-queued':
      case 'now-playing': {
        const payload = message.payload as ClientRoomInfo;
        setRoomState({ ...payload });
        break;
      }

      case 'invoice-paid': {
        setInvoiceState({
          invoice: null,
          loading: false,
          paid: true,
        });
        break;
      }

      case 'invoice-error': {
        toast.error('Failed to generate invoice. Please try again.');
        setInvoiceState({
          invoice: null,
          loading: false,
          paid: false,
        });
        break;
      }
    }
  }, []);

  const connect = useCallback(() => {
    if (devMode) return; // Skip connection in dev mode
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
  }, [devMode]);

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
      setInvoiceState({ invoice: null, loading: true, paid: false });
      sendMessage('make-request', requestPayload);
    },
    [sendMessage]
  );

  const clearInvoice = useCallback(() => {
    setInvoiceState({ invoice: null, loading: false, paid: false });
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
        if (devMode) {
          // Add message locally in dev mode
          setRoomMessages((prev) => [
            ...prev,
            {
              id: `msg_${Date.now()}`,
              senderId: clientId || 'dev_client',
              content: content.trim(),
              isHost: roomState.isHost,
              timestamp: Date.now(),
            },
          ]);
          return;
        }
        sendMessage('room-message', {
          roomCode: roomState.roomCode,
          content: content.trim(),
        });
      }
    },
    [sendMessage, roomState.roomCode, devMode, clientId, roomState.isHost]
  );

  const playNext = useCallback(() => {
    console.log('calling playNext clientside ', roomState.roomCode);
    if (!roomState.roomCode || !roomState.isHost) return;

    sendMessage('play-next', { roomCode: roomState.roomCode });
  }, [sendMessage, roomState.roomCode, roomState.isHost]);

  const addRequest = useCallback(
    (url: string, amount: number) => {
      if (!roomState.roomCode || !roomState.isHost) return;

      sendMessage('host-request', { roomCode: roomState.roomCode, url, amount });
    },
    [sendMessage, roomState.roomCode, roomState.isHost]
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
    addRequest,
    closeRoom,
    sendRoomMessage,
    playNext,
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
