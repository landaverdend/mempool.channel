export interface Message {
  id: string;
  type: MessageType;
  payload: unknown;
  timestamp: number;
}

export type MessageType = 'ping' | 'pong' | 'subscribe' | 'unsubscribe' | 'data';

export interface SubscribePayload {
  channel: string;
}

export interface DataPayload {
  channel: string;
  data: unknown;
}
