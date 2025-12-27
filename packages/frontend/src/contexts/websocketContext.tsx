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
  JoinRoomPayload,
  RoomCreatedPayload,
  HostAwayPayload,
} from '@mempool/shared';

// LocalStorage keys for host session recovery
const HOST_TOKEN_KEY = 'mempool_host_token';
const HOST_ROOM_CODE_KEY = 'mempool_host_room_code';
const HOST_NAME_KEY = 'mempool_host_name';

// Helper functions for host session storage
function saveHostSession(roomCode: string, hostToken: string, name: string) {
  localStorage.setItem(HOST_TOKEN_KEY, hostToken);
  localStorage.setItem(HOST_ROOM_CODE_KEY, roomCode);
  localStorage.setItem(HOST_NAME_KEY, name);
}

function clearHostSession() {
  localStorage.removeItem(HOST_TOKEN_KEY);
  localStorage.removeItem(HOST_ROOM_CODE_KEY);
  localStorage.removeItem(HOST_NAME_KEY);
}

function getHostSession(): { roomCode: string; hostToken: string; name: string } | null {
  const hostToken = localStorage.getItem(HOST_TOKEN_KEY);
  const roomCode = localStorage.getItem(HOST_ROOM_CODE_KEY);
  const name = localStorage.getItem(HOST_NAME_KEY);

  if (hostToken && roomCode && name) {
    return { roomCode, hostToken, name };
  }
  return null;
}

export interface RoomMessage {
  id: string;
  senderName: string;
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
  hostAway: boolean; // True when host is disconnected but room is in grace period

  // Invoice state
  invoiceState: InvoiceState;

  // Connection actions
  connect: () => void;
  disconnect: () => void;
  sendPing: () => void;

  // Room actions
  createRoom: (payload: CreateRoomPayload) => void;
  makeRequest: (payload: MakeRequestPayload) => void;
  joinRoom: (payload: JoinRoomPayload) => void;
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

// Use environment variable or derive from current host in production
const getWebSocketUrl = (): string => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  // In production, use same host with appropriate protocol
  if (import.meta.env.PROD) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }
  // Development default
  return 'ws://localhost:8080';
};

const WEBSOCKET_URL = getWebSocketUrl();

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
    paid: false,
  });
  const [hostAway, setHostAway] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const clientIdRef = useRef<string | null>(null);
  const pendingRejoinRef = useRef<boolean>(false);

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
        console.log('room-created payload: ', payload);
        setRoomState({ ...payload });
        setRoomMessages([]);
        setError(null);
        setHostAway(false);

        // Save host session for reconnection (if we're the host)
        if (payload.isHost && payload.hostToken) {
          const hostName = localStorage.getItem(HOST_NAME_KEY) || 'Host';
          saveHostSession(payload.roomCode, payload.hostToken, hostName);
        }
        break;
      }

      case 'room-joined': {
        const payload = message.payload as ClientRoomInfo;
        console.log('room-joined payload: ', payload);
        setRoomState({ ...payload });
        setRoomMessages([]);
        setError(null);
        setHostAway(false);
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
        setHostAway(false);
        clearHostSession();
        const reasonText = payload.reason.replace(/_/g, ' ');
        setError(`Room closed: ${reasonText}`);
        break;
      }

      case 'host-away': {
        const payload = message.payload as HostAwayPayload;
        console.log('Host is away from room:', payload.roomCode);
        setHostAway(true);
        toast.info('Host disconnected. Waiting for reconnection...');
        break;
      }

      case 'host-rejoined': {
        console.log('Host has rejoined the room');
        setHostAway(false);
        toast.success('Host has reconnected!');
        break;
      }

      case 'user-joined': {
        const payload = message.payload as UserJoinedPayload;
        setRoomState((prev) => ({
          ...prev,
          members: [...prev.members, payload.client],
        }));
        break;
      }

      case 'user-left': {
        const payload = message.payload as UserLeftPayload;
        setRoomState((prev) => ({
          ...prev,
          members: prev.members.filter((m) => m.clientId !== payload.client.clientId),
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
            senderName: payload.senderName,
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
        // If we get a room error (e.g., room not found during rejoin), clear the saved session
        if (payload.error === 'room_not_found' || payload.error === 'not_host') {
          clearHostSession();
        }
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
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const socket = new WebSocket(WEBSOCKET_URL);

    socket.onopen = () => {
      setConnected(true);
      console.log('Connected to server');

      // Check for saved host session and attempt rejoin
      const hostSession = getHostSession();
      if (hostSession && !pendingRejoinRef.current) {
        pendingRejoinRef.current = true;
        console.log('Attempting to rejoin as host:', hostSession.roomCode);

        // Small delay to ensure clientId is set
        setTimeout(() => {
          const rejoinMessage = createMessage('host-rejoin', {
            roomCode: hostSession.roomCode,
            hostToken: hostSession.hostToken,
            name: hostSession.name,
          });
          socket.send(serializeMessage(rejoinMessage));
          pendingRejoinRef.current = false;
        }, 100);
      }
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
  }, [handleMessage]);

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
      // Save name for host session recovery
      localStorage.setItem(HOST_NAME_KEY, createRoomPayload.name);
      sendMessage('create-room', createRoomPayload);
    },
    [sendMessage]
  );

  const joinRoom = useCallback(
    ({ roomCode, name }: JoinRoomPayload) => {
      sendMessage('join-room', { roomCode: roomCode.trim().toUpperCase(), name });
    },
    [sendMessage]
  );

  const leaveRoom = useCallback(() => {
    if (roomState.roomCode) {
      sendMessage('leave-room', { roomCode: roomState.roomCode });
      // Clear state immediately to prevent race condition with Home navigation
      setRoomState(EMPTY_ROOM_STATE);
      setRoomMessages([]);
    }
  }, [sendMessage, roomState.roomCode]);

  const closeRoom = useCallback(() => {
    if (roomState.roomCode && roomState.isHost) {
      // Clear host session before closing (explicit close)
      clearHostSession();
      sendMessage('close-room', { roomCode: roomState.roomCode });
      // Clear state immediately to prevent race condition with Home navigation
      setRoomState(EMPTY_ROOM_STATE);
      setRoomMessages([]);
      setHostAway(false);
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
    [sendMessage, roomState.roomCode, clientId, roomState.isHost]
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
    hostAway,
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
