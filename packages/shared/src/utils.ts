import { Message, MessageType } from './types.js';

export function createMessage(type: MessageType, payload: unknown): Message {
  return {
    id: generateId(),
    type,
    payload,
    timestamp: Date.now(),
  };
}

export function parseMessage(data: string): Message | null {
  try {
    const parsed = JSON.parse(data);
    if (isValidMessage(parsed)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function serializeMessage(message: Message): string {
  return JSON.stringify(message);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function isValidMessage(obj: unknown): obj is Message {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  const msg = obj as Record<string, unknown>;
  return (
    typeof msg.id === 'string' &&
    typeof msg.type === 'string' &&
    typeof msg.timestamp === 'number' &&
    ['ping', 'pong', 'subscribe', 'unsubscribe', 'data'].includes(msg.type as string)
  );
}
