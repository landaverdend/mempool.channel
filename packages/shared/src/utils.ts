import { Message, MessageType } from './types.js';

export function createMessage(type: MessageType, payload: unknown): Message {
  return {
    id: generateId(),
    type,
    payload,
    timestamp: Date.now(),
  };
}

export function parseMessage(data: string): Message {

  const parsed = JSON.parse(data);
  if (isValidMessage(parsed)) {
    return parsed;
  }

  throw new Error('Invalid message');
}

export function serializeMessage(message: Message): string {
  return JSON.stringify(message);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

const VALID_MESSAGE_TYPES = [
  'ping',
  'pong',
  'subscribe',
  'unsubscribe',
  'data',
  'create-room',
  'join-room',
  'leave-room',
  'close-room',
  'make-request',
  'invoice-generated',
  'room-message',
  'room-created',
  'room-joined',
  'room-left',
  'room-closed',
  'room-error',
  'user-joined',
  'user-left',
];

export function isValidMessage(obj: unknown): obj is Message {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  const msg = obj as Record<string, unknown>;
  return (
    typeof msg.id === 'string' &&
    typeof msg.type === 'string' &&
    typeof msg.timestamp === 'number' &&
    VALID_MESSAGE_TYPES.includes(msg.type as string)
  );
}

// Room code utilities
// Excludes ambiguous characters: I, O, 0, 1
const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_CODE_LENGTH = 6;

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * ROOM_CODE_CHARS.length);
    code += ROOM_CODE_CHARS[randomIndex];
  }
  return code;
}

export function isValidRoomCode(code: string): boolean {
  if (typeof code !== 'string' || code.length !== ROOM_CODE_LENGTH) {
    return false;
  }
  return /^[A-HJ-NP-Z2-9]+$/.test(code);
}

export function normalizeRoomCode(code: string): string {
  return code.toUpperCase().trim();
}
