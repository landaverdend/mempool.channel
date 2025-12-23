import { WebSocketServer, WebSocket } from 'ws';
import { createMessage, parseMessage, serializeMessage, generateId, MessageType, Message } from '@mempool/shared';
import { ClientManager, RoomManager, InvoiceManager, ExtendedWebSocket } from './managers/index.js';
import { handlers, handleDisconnect, HandlerContext } from './handlers/index.js';

export interface ServerOptions {
  port: number;
}

export class MempoolBandServer {
  private wss: WebSocketServer;

  private clientManager: ClientManager;
  private roomManager: RoomManager;
  private invoiceManager: InvoiceManager;

  private ctx: HandlerContext;

  constructor(options: ServerOptions) {
    this.clientManager = new ClientManager();
    this.roomManager = new RoomManager();

    // Create handler context
    this.ctx = {
      clientManager: this.clientManager,
      roomManager: this.roomManager,
      invoiceManager: null!, // Set after creation
      broadcastToRoom: this.broadcastToRoom.bind(this),
      sendError: this.sendError.bind(this),
      sendMessage: this.sendMessage.bind(this),
    };

    // Create invoice manager with context
    this.invoiceManager = new InvoiceManager(
      this.roomManager,
      this.clientManager,
      this.broadcastToRoom.bind(this),
      this.broadcastToClient.bind(this)
    );
    this.ctx.invoiceManager = this.invoiceManager;

    // Create WebSocket server
    this.wss = new WebSocketServer({ port: options.port });
    this.setupEventHandlers();

    console.log(`WebSocket server started on ws://localhost:${options.port}`);
  }

  private setupEventHandlers(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      const extWs = ws as ExtendedWebSocket;
      extWs.clientId = generateId();

      this.clientManager.add(extWs.clientId, extWs);
      console.log(`Client connected: ${extWs.clientId}`);

      // Send welcome message with client ID
      this.sendMessage(extWs, 'data', {
        message: 'Welcome to Mempool Band WebSocket Server!',
        clientId: extWs.clientId,
      });

      ws.on('message', (data: Buffer) => this.handleMessage(extWs, data));
      ws.on('close', () => handleDisconnect(extWs, this.ctx));
      ws.on('error', (error) => {
        console.error(`WebSocket error for ${extWs.clientId}:`, error);
      });
    });
  }

  private async handleMessage(ws: ExtendedWebSocket, data: Buffer): Promise<void> {
    const message = parseMessage(data.toString());

    if (!message) {
      console.log('Received invalid message');
      return;
    }

    console.log(`Received from ${ws.clientId}: ${message.type}`, message.payload);

    // Handle built-in message types
    if (message.type === 'ping') {
      this.handlePing(ws, message.payload as { time: number });
      return;
    }

    if (message.type === 'subscribe') {
      this.handleSubscribe(ws, message.payload as { channel: string });
      return;
    }

    if (message.type === 'unsubscribe') {
      this.handleUnsubscribe(ws, message.payload as { channel: string });
      return;
    }

    // Look up handler in map
    const handler = handlers[message.type];
    if (handler) {
      await handler(ws, message.payload, this.ctx);
    } else {
      console.log(`Unhandled message type: ${message.type}`);
    }
  }

  // Built-in handlers
  private handlePing(ws: ExtendedWebSocket, payload: { time: number }): void {
    this.sendMessage(ws, 'pong', {
      originalTime: payload.time,
      serverTime: Date.now(),
    });
  }

  private handleSubscribe(ws: ExtendedWebSocket, payload: { channel: string }): void {
    this.sendMessage(ws, 'data', {
      channel: payload.channel,
      data: { subscribed: true },
    });
  }

  private handleUnsubscribe(ws: ExtendedWebSocket, payload: { channel: string }): void {
    this.sendMessage(ws, 'data', {
      channel: payload.channel,
      data: { subscribed: false },
    });
  }

  // Helper methods (used by handlers via context)
  private broadcastToRoom(roomCode: string, message: Message, excludeClientId?: string): void {
    const members = this.roomManager.getMembers(roomCode);

    members.forEach((memberId) => {
      if (excludeClientId && memberId === excludeClientId) return;
      this.clientManager.send(memberId, serializeMessage(message));
    });
  }

  private broadcastToClient(roomCode: string, clientId: string, type: string, payload: unknown): void {
    const room = this.roomManager.get(roomCode);

    if (!room) {
      console.error(`Room ${roomCode} not found`);
      return;
    }

    const client = this.clientManager.get(clientId);
    if (!client) {
      console.error(`Client ${clientId} not found`);
      return;
    }

    const message = createMessage(type as MessageType, payload);
    client.send(serializeMessage(message));
  }

  private sendError(ws: ExtendedWebSocket, error: string, message: string, roomCode?: string): void {
    this.sendMessage(ws, 'room-error', { error, message, roomCode });
  }

  private sendMessage(ws: ExtendedWebSocket, type: string, payload: unknown): void {
    const message = createMessage(type as Parameters<typeof createMessage>[0], payload);
    ws.send(serializeMessage(message));
  }

  // Public API
  close(): Promise<void> {
    return new Promise((resolve) => {
      console.log('Shutting down server...');
      this.wss.close(() => {
        console.log('Server closed');
        resolve();
      });
    });
  }
}
