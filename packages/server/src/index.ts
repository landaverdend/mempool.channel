import { WebSocketServer, WebSocket } from 'ws';
import {
  createMessage,
  parseMessage,
  serializeMessage,
  generateId,
  generateRoomCode,
  isValidRoomCode,
  normalizeRoomCode,
  JoinRoomPayload,
  LeaveRoomPayload,
  CloseRoomPayload,
  RoomMessagePayload,
  RoomErrorType,
  CreateRoomPayload,
  MakeRequestPayload,
  PlayNextPayload,
  SkipCurrentPayload,
  ClientRoomInfo,
  ClientRequest,
} from '@mempool/shared';
import { createNWCClient } from './nostrClient.js';
import { Room } from './types.js';

const PORT = 8080;

// Extended WebSocket with client ID
interface ExtendedWebSocket extends WebSocket {
  clientId: string;
}

const generateTestQueue = (clientId: string, count: number = 10) => {
  const queue: ClientRequest[] = [];

  for (let i = 0; i < count; i++) {
    queue.push({
      createdAt: Date.now(),
      amount: Math.floor(Math.random() * 10000),
      url: `https://example.com/${i}`,
      requesterId: clientId,
    });
  }

  return queue;
};

// Data structures for room management
const clients = new Map<string, ExtendedWebSocket>();
const rooms = new Map<string, Room>();
const clientRooms = new Map<string, string>();

const wss = new WebSocketServer({ port: PORT });

console.log(`WebSocket server started on ws://localhost:${PORT}`);

wss.on('connection', (ws: WebSocket) => {
  const extWs = ws as ExtendedWebSocket;
  extWs.clientId = generateId();

  clients.set(extWs.clientId, extWs);
  console.log(`Client connected: ${extWs.clientId}`);

  // Send welcome message with client ID
  const welcomeMessage = createMessage('data', {
    message: 'Welcome to Mempool Band WebSocket Server!',
    clientId: extWs.clientId,
  });
  ws.send(serializeMessage(welcomeMessage));

  ws.on('message', (data: Buffer) => {
    const message = parseMessage(data.toString());

    if (!message) {
      console.log('Received invalid message');
      return;
    }

    console.log(`Received from ${extWs.clientId}: ${message.type}`, message.payload);

    switch (message.type) {
      case 'ping':
        handlePing(extWs, message.payload as { time: number });
        break;

      case 'subscribe':
        handleSubscribe(extWs, message.payload as { channel: string });
        break;

      case 'unsubscribe':
        handleUnsubscribe(extWs, message.payload as { channel: string });
        break;

      case 'create-room':
        handleCreateRoom(extWs, message.payload as CreateRoomPayload);
        break;

      case 'join-room':
        handleJoinRoom(extWs, message.payload as JoinRoomPayload);
        break;

      case 'leave-room':
        handleLeaveRoom(extWs, message.payload as LeaveRoomPayload);
        break;

      case 'close-room':
        handleCloseRoom(extWs, message.payload as CloseRoomPayload);
        break;

      case 'room-message':
        handleRoomMessage(extWs, message.payload as RoomMessagePayload);
        break;

      case 'make-request':
        handleMakeRequest(extWs, message.payload as MakeRequestPayload);
        break;

      case 'play-next':
        handlePlayNext(extWs, message.payload as PlayNextPayload);
        break;

      case 'skip-current':
        handleSkipCurrent(extWs, message.payload as SkipCurrentPayload);
        break;

      case 'add-request':
        handleAddRequest(extWs, message.payload as MakeRequestPayload);
        break;
      default:
        console.log(`Unhandled message type: ${message.type}`);
    }
  });

  ws.on('close', () => {
    handleDisconnect(extWs);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for ${extWs.clientId}:`, error);
  });
});

// Existing handlers
function handlePing(ws: ExtendedWebSocket, payload: { time: number }): void {
  const pongMessage = createMessage('pong', {
    originalTime: payload.time,
    serverTime: Date.now(),
  });
  ws.send(serializeMessage(pongMessage));
}

function handleSubscribe(ws: ExtendedWebSocket, payload: { channel: string }): void {
  const response = createMessage('data', {
    channel: payload.channel,
    data: { subscribed: true },
  });
  ws.send(serializeMessage(response));
}

function handleUnsubscribe(ws: ExtendedWebSocket, payload: { channel: string }): void {
  const response = createMessage('data', {
    channel: payload.channel,
    data: { subscribed: false },
  });
  ws.send(serializeMessage(response));
}

// Helper to build client room info from server Room
function buildClientRoomInfo(room: Room, clientId: string): ClientRoomInfo {
  return {
    roomCode: room.code,
    isHost: room.hostId === clientId,
    members: room.members,

    currentlyPlaying: room.currentlyPlaying,
    playedRequests: room.playedRequests,
    requestQueue: room.requestQueue,
  };
}

// Room handlers
async function handleCreateRoom(ws: ExtendedWebSocket, payload: CreateRoomPayload): Promise<void> {
  // Check if client is already in a room
  if (clientRooms.has(ws.clientId)) {
    sendError(ws, 'already_in_room', 'You are already in a room. Leave first.');
    return;
  }

  // Create and validate NWC client
  let nwcClient;
  try {
    nwcClient = await createNWCClient(payload.nwcUrl);
  } catch (error) {
    console.error('Error connecting to NWC:', error);
    sendError(ws, 'invalid_nwc_uri', 'Failed to connect to NWC wallet.');
    return;
  }

  // Generate unique room code
  let roomCode: string;
  do {
    roomCode = generateRoomCode();
  } while (rooms.has(roomCode));

  // Create room with NWC client
  const room: Room = {
    code: roomCode,
    hostId: ws.clientId,
    members: [ws.clientId],
    createdAt: Date.now(),
    currentlyPlaying: null,
    requestQueue: [],
    pendingInvoices: [],
    playedRequests: [],
    nwcClient,
  };

  // Start polling for invoice payments
  room.pollInterval = setInterval(() => pollInvoices(roomCode), 3000);

  rooms.set(roomCode, room);
  clientRooms.set(ws.clientId, roomCode);

  console.log(`Room created: ${roomCode} by ${ws.clientId}`);

  // Send confirmation to host
  const response = createMessage('room-created', buildClientRoomInfo(room, ws.clientId));
  ws.send(serializeMessage(response));
}

function handleJoinRoom(ws: ExtendedWebSocket, payload: JoinRoomPayload): void {
  const roomCode = normalizeRoomCode(payload.roomCode || '');

  // Validate room code format
  if (!isValidRoomCode(roomCode)) {
    sendError(ws, 'invalid_code', 'Invalid room code format.', roomCode);
    return;
  }

  // Check if already in a room
  if (clientRooms.has(ws.clientId)) {
    sendError(ws, 'already_in_room', 'You are already in a room. Leave first.', roomCode);
    return;
  }

  // Check if room exists
  const room = rooms.get(roomCode);
  if (!room) {
    sendError(ws, 'room_not_found', 'Room not found.', roomCode);
    return;
  }

  // Add to room
  room.members.push(ws.clientId);
  clientRooms.set(ws.clientId, roomCode);

  console.log(`Client ${ws.clientId} joined room ${roomCode}`);

  // Send join confirmation to new member
  const joinResponse = createMessage('room-joined', buildClientRoomInfo(room, ws.clientId));
  ws.send(serializeMessage(joinResponse));

  // Notify other room members
  broadcastToRoom(
    roomCode,
    'user-joined',
    {
      roomCode,
      clientId: ws.clientId,
    },
    ws.clientId
  );
}

function handleLeaveRoom(ws: ExtendedWebSocket, payload: LeaveRoomPayload): void {
  const roomCode = normalizeRoomCode(payload.roomCode || '');

  const currentRoom = clientRooms.get(ws.clientId);
  if (!currentRoom || currentRoom !== roomCode) {
    sendError(ws, 'not_in_room', 'You are not in this room.', roomCode);
    return;
  }

  removeClientFromRoom(ws.clientId, roomCode);
}

function handleAddRequest(ws: ExtendedWebSocket, payload: MakeRequestPayload): void {
  const roomCode = normalizeRoomCode(payload.roomCode || '');

  const room = rooms.get(roomCode);
  if (!room) {
    sendError(ws, 'room_not_found', 'Room not found.', roomCode);
    return;
  }

  if (room.hostId !== ws.clientId) {
    sendError(ws, 'not_host', 'Only the host can add requests.', roomCode);
    return;
  }


  room.requestQueue.push({
    createdAt: Date.now(),
    amount: payload.amount,
    url: payload.url,
    requesterId: ws.clientId,
  });

  broadcastToRoom(roomCode, 'item-queued', buildClientRoomInfo(room, ws.clientId));
}

function handleCloseRoom(ws: ExtendedWebSocket, payload: CloseRoomPayload): void {
  const roomCode = normalizeRoomCode(payload.roomCode || '');

  const room = rooms.get(roomCode);
  if (!room) {
    sendError(ws, 'room_not_found', 'Room not found.', roomCode);
    return;
  }

  if (room.hostId !== ws.clientId) {
    sendError(ws, 'not_host', 'Only the host can close the room.', roomCode);
    return;
  }

  closeRoom(roomCode, 'host_closed');
}

function handleRoomMessage(ws: ExtendedWebSocket, payload: RoomMessagePayload): void {
  const roomCode = normalizeRoomCode(payload.roomCode || '');

  const currentRoom = clientRooms.get(ws.clientId);
  if (!currentRoom || currentRoom !== roomCode) {
    sendError(ws, 'not_in_room', 'You are not in this room.', roomCode);
    return;
  }

  const room = rooms.get(roomCode);
  if (!room) {
    sendError(ws, 'room_not_found', 'Room not found.', roomCode);
    return;
  }

  // Broadcast to all room members (including sender)
  const message = createMessage('room-message', {
    roomCode,
    senderId: ws.clientId,
    content: payload.content,
    isHost: room.hostId === ws.clientId,
  });

  room.members.forEach((memberId) => {
    const memberWs = clients.get(memberId);
    if (memberWs && memberWs.readyState === WebSocket.OPEN) {
      memberWs.send(serializeMessage(message));
    }
  });
}

async function handleMakeRequest(ws: ExtendedWebSocket, payload: MakeRequestPayload): Promise<void> {
  const roomCode = normalizeRoomCode(payload.roomCode || '');

  const currentRoom = clientRooms.get(ws.clientId);
  if (!currentRoom || currentRoom !== roomCode) {
    sendError(ws, 'not_in_room', 'You are not in this room.', roomCode);
    return;
  }

  const room = rooms.get(roomCode);
  if (!room) {
    sendError(ws, 'room_not_found', 'Room not found.', roomCode);
    return;
  }

  try {
    const invoice = await room.nwcClient.makeInvoice({
      amount: payload.amount,
      description: payload.comment,
    });

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 60 * 10; // expires in 10 minutes

    // Track pending invoice for payment polling
    room.pendingInvoices.push({
      paymentHash: invoice.payment_hash,
      invoice: invoice.invoice,
      amount: invoice.amount,
      description: invoice.description || '',
      createdAt: now,
      expiresAt,
      roomCode,
      requesterId: ws.clientId,
      requesterUrl: payload.url,
    });

    const invoiceResponse = createMessage('invoice-generated', {
      invoice: {
        pr: invoice.invoice,
        paymentHash: invoice.payment_hash,
        amount: invoice.amount,
        description: invoice.description,
        expiresAt,
      },
    });

    ws.send(serializeMessage(invoiceResponse));
  } catch (error) {
    console.error('Error creating invoice: ', error);
    sendError(ws, 'invoice_error', 'Failed to create invoice.', roomCode);
    return;
  }
}

function handlePlayNext(ws: ExtendedWebSocket, payload: PlayNextPayload): void {
  const roomCode = normalizeRoomCode(payload.roomCode || '');

  const room = rooms.get(roomCode);
  if (!room) {
    sendError(ws, 'room_not_found', 'Room not found.', roomCode);
    return;
  }

  // Only host can control playback
  if (room.hostId !== ws.clientId) {
    sendError(ws, 'not_host', 'Only the host can control playback.', roomCode);
    return;
  }

  // Move current song to played if exists
  if (room.currentlyPlaying) {
    room.playedRequests.push({
      createdAt: room.currentlyPlaying.startedAt,
      amount: room.currentlyPlaying.amount,
      url: room.currentlyPlaying.url,
      requesterId: room.currentlyPlaying.requesterId,
    });
  }

  // Get next from queue
  const nextRequest = room.requestQueue.shift();
  if (!nextRequest) {
    room.currentlyPlaying = null;
  } else {
    room.currentlyPlaying = {
      url: nextRequest.url,
      title: payload.title,
      thumbnail: payload.thumbnail,
      startedAt: Date.now(),
      requesterId: nextRequest.requesterId,
      amount: nextRequest.amount,
    };
  }

  console.log(`Now playing in ${roomCode}: ${room.currentlyPlaying?.title || 'nothing'}`);

  // Broadcast updated state to all room members
  room.members.forEach((memberId) => {
    const memberWs = clients.get(memberId);
    if (memberWs && memberWs.readyState === WebSocket.OPEN) {
      const response = createMessage('now-playing', buildClientRoomInfo(room, memberId));
      memberWs.send(serializeMessage(response));
    }
  });
}

function handleSkipCurrent(ws: ExtendedWebSocket, payload: SkipCurrentPayload): void {
  const roomCode = normalizeRoomCode(payload.roomCode || '');

  const room = rooms.get(roomCode);
  if (!room) {
    sendError(ws, 'room_not_found', 'Room not found.', roomCode);
    return;
  }

  // Only host can control playback
  if (room.hostId !== ws.clientId) {
    sendError(ws, 'not_host', 'Only the host can control playback.', roomCode);
    return;
  }

  // Move current song to played if exists
  if (room.currentlyPlaying) {
    room.playedRequests.push({
      createdAt: room.currentlyPlaying.startedAt,
      amount: room.currentlyPlaying.amount,
      url: room.currentlyPlaying.url,
      requesterId: room.currentlyPlaying.requesterId,
    });
    room.currentlyPlaying = null;
  }

  console.log(`Skipped current song in ${roomCode}`);

  // Broadcast updated state to all room members
  room.members.forEach((memberId) => {
    const memberWs = clients.get(memberId);
    if (memberWs && memberWs.readyState === WebSocket.OPEN) {
      const response = createMessage('now-playing', buildClientRoomInfo(room, memberId));
      memberWs.send(serializeMessage(response));
    }
  });
}

async function pollInvoices(roomCode: string): Promise<void> {
  const room = rooms.get(roomCode);
  if (!room || room.pendingInvoices.length === 0) return;

  const now = Math.floor(Date.now() / 1000);

  console.log('Polling invoices for room: ', roomCode);

  // Process each pending invoice
  for (let i = room.pendingInvoices.length - 1; i >= 0; i--) {
    const pending = room.pendingInvoices[i];

    // Remove expired invoices
    if (pending.expiresAt < now) {
      room.pendingInvoices.splice(i, 1);
      console.log(`Invoice expired: ${pending.paymentHash.substring(0, 8)}...`);
      continue;
    }

    // Check payment status
    try {
      const lookup = await room.nwcClient.lookupInvoice({
        payment_hash: pending.paymentHash,
      });

      // If the invoice is paid, add the request to the queue and broadcast to the room
      if (lookup.settled_at) {
        // Invoice paid - remove from pending and notify room
        room.pendingInvoices.splice(i, 1);
        console.log(`Invoice paid: ${pending.paymentHash.substring(0, 8)}...`);

        // Add to the request queue and broadcast to the room
        room.requestQueue.push({
          createdAt: Math.floor(Date.now() / 1000),
          amount: pending.amount,
          url: pending.requesterUrl,
          requesterId: pending.requesterId,
        });

        // Sort the queue by amount in descending order
        room.requestQueue.sort((a, b) => b.amount - a.amount);

        // Broadcast the updated room info to the room
        broadcastToRoom(roomCode, 'item-queued', buildClientRoomInfo(room, pending.requesterId));
      }
    } catch (err) {
      // Log but don't remove - might be temporary error
      console.error(`Error checking invoice ${pending.paymentHash.substring(0, 8)}:`, err);
    }
  }
}

function handleDisconnect(ws: ExtendedWebSocket): void {
  console.log(`Client disconnected: ${ws.clientId}`);

  // Handle room cleanup if client was in a room
  const roomCode = clientRooms.get(ws.clientId);
  if (roomCode) {
    removeClientFromRoom(ws.clientId, roomCode);
  }

  // Remove from clients map
  clients.delete(ws.clientId);
}

// Helper functions
function removeClientFromRoom(clientId: string, roomCode: string): void {
  const room = rooms.get(roomCode);
  if (!room) return;

  // Remove from room members
  room.members = room.members.filter((id) => id !== clientId);
  clientRooms.delete(clientId);

  const clientWs = clients.get(clientId);
  if (clientWs && clientWs.readyState === WebSocket.OPEN) {
    const leaveResponse = createMessage('room-left', { roomCode });
    clientWs.send(serializeMessage(leaveResponse));
  }

  console.log(`Client ${clientId} left room ${roomCode}`);

  // Check if host left - close the room (ephemeral)
  if (room.hostId === clientId) {
    closeRoom(roomCode, 'host_disconnected');
    return;
  }

  // Check if room is empty
  if (room.members.length === 0) {
    closeRoom(roomCode, 'all_left');
    return;
  }

  // Notify remaining members
  broadcastToRoom(roomCode, 'user-left', {
    roomCode,
    clientId,
  });
}

function closeRoom(roomCode: string, reason: 'host_closed' | 'host_disconnected' | 'all_left'): void {
  const room = rooms.get(roomCode);
  if (!room) return;

  console.log(`Closing room ${roomCode}: ${reason}`);

  // Stop polling for invoice payments
  if (room.pollInterval) {
    clearInterval(room.pollInterval);
  }

  // Clean up NWC client
  try {
    room.nwcClient.close();
  } catch (err) {
    console.error('Error closing NWC client:', err);
  }

  // Notify all members
  const closeMessage = createMessage('room-closed', {
    roomCode,
    reason,
  });

  room.members.forEach((memberId) => {
    clientRooms.delete(memberId);
    const memberWs = clients.get(memberId);
    if (memberWs && memberWs.readyState === WebSocket.OPEN) {
      memberWs.send(serializeMessage(closeMessage));
    }
  });

  // Delete room
  rooms.delete(roomCode);
}

function broadcastToRoom(roomCode: string, type: string, payload: unknown, excludeClientId?: string): void {
  const room = rooms.get(roomCode);
  if (!room) return;

  const message = createMessage(type as Parameters<typeof createMessage>[0], payload);

  room.members.forEach((memberId) => {
    if (excludeClientId && memberId === excludeClientId) return;

    const memberWs = clients.get(memberId);
    if (memberWs && memberWs.readyState === WebSocket.OPEN) {
      memberWs.send(serializeMessage(message));
    }
  });
}

function sendError(ws: ExtendedWebSocket, error: RoomErrorType, message: string, roomCode?: string): void {
  const errorResponse = createMessage('room-error', {
    error,
    message,
    roomCode,
  });
  ws.send(serializeMessage(errorResponse));
}

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  wss.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
