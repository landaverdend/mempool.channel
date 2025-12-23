import { Message } from '@mempool/shared';
import { ExtendedWebSocket, RoomManager, ClientManager, InvoiceManager } from '../managers/index.js';

export interface HandlerContext {
  roomManager: RoomManager;
  clientManager: ClientManager;
  invoiceManager: InvoiceManager;
  broadcastToRoom: (roomCode: string, message: Message, excludeClientId?: string) => void;
  sendError: (ws: ExtendedWebSocket, error: string, message: string, roomCode?: string) => void;
  sendMessage: (ws: ExtendedWebSocket, type: string, payload: unknown) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Handler<T = any> = (ws: ExtendedWebSocket, payload: T, ctx: HandlerContext) => void | Promise<void>;
