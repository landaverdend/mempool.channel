export interface Message {
  id: string;
  type: MessageType;
  payload: unknown;
  timestamp: number;
}

export type MessageType =
  | 'ping'
  | 'pong'
  | 'subscribe'
  | 'unsubscribe'
  | 'data'

  // Invoice Messages
  | 'make-request'
  | 'invoice-generated'
  | 'invoice-error'

  // Room message types
  | 'create-room'
  | 'join-room'
  | 'leave-room'
  | 'close-room'
  | 'room-message'
  | 'item-queued'

  // Playback control (host only)
  | 'play-next'
  | 'skip-current'
  | 'now-playing'

  // Room response types
  | 'room-created'
  | 'room-joined'
  | 'room-left'
  | 'room-closed'
  | 'room-error'
  | 'user-joined'
  | 'user-left';

export interface SubscribePayload {
  channel: string;
}

export interface DataPayload {
  channel: string;
  data: unknown;
}

// Room request payloads
export interface JoinRoomPayload {
  roomCode: string;
}

export interface LeaveRoomPayload {
  roomCode: string;
}

export interface CloseRoomPayload {
  roomCode: string;
}

export interface RoomMessagePayload {
  roomCode: string;
  content: unknown;
}

export interface CreateRoomPayload {
  nwcUrl: string;
}

// Client request info sent to clients (subset of server Request)
export interface ClientRequest {
  createdAt: number;
  amount: number;
  url: string;
  requesterId: string;
}

// Currently playing song info
export interface NowPlaying {
  url: string;
  title: string;
  thumbnail: string;
  startedAt: number;
  requesterId: string;
  amount: number;
}

// Shared room info sent to clients (subset of server Room)
export interface ClientRoomInfo {
  roomCode: string;
  isHost: boolean;
  members: string[];

  currentlyPlaying: NowPlaying | null;
  playedRequests: ClientRequest[];
  requestQueue: ClientRequest[];
}

export interface RoomLeftPayload {
  roomCode: string;
}

export interface RoomClosedPayload {
  roomCode: string;
  reason: 'host_closed' | 'host_disconnected' | 'all_left';
}

export interface RoomErrorPayload {
  error: RoomErrorType;
  message: string;
  roomCode?: string;
}

export type RoomErrorType =
  | 'room_not_found'
  | 'already_in_room'
  | 'not_in_room'
  | 'not_host'
  | 'invalid_code'
  | 'invalid_nwc_uri'
  | 'invoice_error';

export interface UserJoinedPayload {
  roomCode: string;
  clientId: string;
}

export interface UserLeftPayload {
  roomCode: string;
  clientId: string;
}

export interface RoomMessageReceivedPayload {
  roomCode: string;
  senderId: string;
  content: unknown;
  isHost: boolean;
}

// Invoice request/response payloads
export interface MakeRequestPayload {
  roomCode: string;
  amount: number; // Amount in satoshis
  comment?: string; // Optional comment for the payment
  url: string; // URL that links to the next track/video
}

export interface InvoiceGeneratedPayload {
  invoice: {
    pr: string; // BOLT11 payment request
    amount: number;
    description?: string;
    expiresAt: number;
  };
}

export interface InvoiceErrorPayload {
  error: string;
  roomCode: string;
}

// Playback control payloads
export interface PlayNextPayload {
  roomCode: string;
  title: string;
  thumbnail: string;
}

export interface SkipCurrentPayload {
  roomCode: string;
}

export interface NowPlayingPayload {
  roomCode: string;
  nowPlaying: NowPlaying | null;
}
