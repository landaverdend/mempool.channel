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

// Room response payloads
export interface RoomCreatedPayload {
  roomCode: string;
  isHost: true;
}

export interface RoomJoinedPayload {
  roomCode: string;
  isHost: boolean;
  members: string[];
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

export type RoomErrorType = 'room_not_found' | 'already_in_room' | 'not_in_room' | 'not_host' | 'invalid_code';

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
