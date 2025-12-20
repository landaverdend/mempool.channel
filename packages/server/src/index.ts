import { WebSocketServer, WebSocket } from 'ws';
import { createMessage, parseMessage, serializeMessage, Message } from '@mempool/shared';

const PORT = 8080;

const wss = new WebSocketServer({ port: PORT });

console.log(`WebSocket server started on ws://localhost:${PORT}`);

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');

  ws.on('message', (data: Buffer) => {
    const message = parseMessage(data.toString());

    if (!message) {
      console.log('Received invalid message');
      return;
    }

    console.log(`Received: ${message.type}`, message.payload);

    switch (message.type) {
      case 'ping':
        const pongMessage = createMessage('pong', {
          originalTime: (message.payload as { time: number }).time,
          serverTime: Date.now()
        });
        ws.send(serializeMessage(pongMessage));
        break;

      case 'subscribe':
        const subscribeResponse = createMessage('data', {
          channel: (message.payload as { channel: string }).channel,
          data: { subscribed: true }
        });
        ws.send(serializeMessage(subscribeResponse));
        break;

      case 'unsubscribe':
        const unsubscribeResponse = createMessage('data', {
          channel: (message.payload as { channel: string }).channel,
          data: { subscribed: false }
        });
        ws.send(serializeMessage(unsubscribeResponse));
        break;

      default:
        console.log(`Unhandled message type: ${message.type}`);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  // Send welcome message
  const welcomeMessage = createMessage('data', {
    message: 'Welcome to Mempool Band WebSocket Server!'
  });
  ws.send(serializeMessage(welcomeMessage));
});

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  wss.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
