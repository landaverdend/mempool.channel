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

// Room types
export interface Room {
  code: string;
  hostId: string;
  members: string[];
  createdAt: number;

  hostLightningAddress: string;
  lnParams: LnParams; // We might not want to expose this to the client.
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
  lightningAddress: string;
}

// Room response payloads
export interface RoomCreatedPayload {
  roomCode: string;
  isHost: true;
  hostLightningAddress: string;
  minSendable: number;
  maxSendable: number;
}

export interface RoomJoinedPayload {
  roomCode: string;
  isHost: boolean;
  members: string[];
  hostLightningAddress: string;

  minSendable: number;
  maxSendable: number;
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
  | 'invalid_lightning_address';

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

export interface LnParams {
  callback: string; // The URL from LN SERVICE which will accept the pay request parameters
  maxSendable: number; // Max amount LN SERVICE is willing to receive
  minSendable: number; // Min amount LN SERVICE is willing to receive, can not be less than 1 or more than `maxSendable`
  metadata: string; // Metadata json which must be presented as raw string here, this is required to pass signature verification at a later step
  commentAllowed: number; // Optional number of characters accepted for the `comment` query parameter on subsequent callback, defaults to 0 if not provided. (no comment allowed)
  withdrawLink: string; // Optional lnurl-withdraw link (for explanation see justification.md)
  tag: 'payRequest'; // Type of LNURL
}

// Invoice request/response payloads
export interface MakeRequestPayload {
  roomCode: string;
  amount: number; // Amount in satoshis
  comment?: string; // Optional comment for the payment
}

export interface InvoiceGeneratedPayload {
  invoice: {
    pr: string; // BOLT11 payment request
    routes: unknown[];
  };
}

export interface InvoiceErrorPayload {
  error: string;
  roomCode: string;
}
