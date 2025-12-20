import { WebSocketServer, WebSocket } from 'ws';
import {
  createMessage,
  parseMessage,
  serializeMessage,
  generateId,
  generateRoomCode,
  isValidRoomCode,
  normalizeRoomCode,
  Room,
  JoinRoomPayload,
  LeaveRoomPayload,
  CloseRoomPayload,
  RoomMessagePayload,
  RoomErrorType,
  CreateRoomPayload,
  RoomJoinedPayload,
  RoomCreatedPayload,
  LnParams,
} from '@mempool/shared';
import { getLNParams } from './utils.js';

const PORT = 8080;

// Extended WebSocket with client ID
interface ExtendedWebSocket extends WebSocket {
  clientId: string;
}

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

// Room handlers
async function handleCreateRoom(ws: ExtendedWebSocket, payload: CreateRoomPayload): Promise<void> {
  // Check if client is already in a room
  if (clientRooms.has(ws.clientId)) {
    sendError(ws, 'already_in_room', 'You are already in a room. Leave first.');
    return;
  }

  let lnParams: LnParams;
  try {
    lnParams = await getLNParams(payload.lightningAddress);
    console.log(lnParams);
  } catch (error) {
    sendError(ws, 'invalid_lightning_address', 'Invalid lightning address');
    return;
  }

  // Generate unique room code
  let roomCode: string;
  do {
    roomCode = generateRoomCode();
  } while (rooms.has(roomCode));

  // Create room
  const room: Room = {
    code: roomCode,
    hostId: ws.clientId,
    members: [ws.clientId],
    createdAt: Date.now(),
    hostLightningAddress: payload.lightningAddress,
    lnParams: lnParams
  };

  rooms.set(roomCode, room);
  clientRooms.set(ws.clientId, roomCode);

  console.log(`Room created: ${roomCode} by ${ws.clientId}`);

  // Send confirmation to host
  const response = createMessage('room-created', {
    roomCode,
    isHost: true,
    hostLightningAddress: payload.lightningAddress,
  } as RoomCreatedPayload);
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
  const joinResponse = createMessage('room-joined', {
    roomCode,
    isHost: room.hostId === ws.clientId,
    members: room.members,
    hostLightningAddress: room.hostLightningAddress,
  } as RoomJoinedPayload);
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
