import {
  CreateRoomPayload,
  JoinRoomPayload,
  LeaveRoomPayload,
  CloseRoomPayload,
  RoomMessagePayload,
  normalizeRoomCode,
  isValidRoomCode,
  createMessage,
} from '@mempool/shared';
import { createNWCClient } from '../nostrClient.js';
import { Handler, HandlerContext } from './types.js';
import { ExtendedWebSocket } from '../managers/index.js';

export const handleCreateRoom: Handler<CreateRoomPayload> = async (ws, payload, ctx) => {
  const { roomManager, clientManager, invoiceManager } = ctx;

  // Check if client is already in a room
  if (clientManager.isInRoom(ws.clientId)) {
    ctx.sendError(ws, 'already_in_room', 'You are already in a room. Leave first.');
    return;
  }

  // Create and validate NWC client
  let nwcClient;
  try {
    nwcClient = await createNWCClient(payload.nwcUrl);
  } catch (error) {
    console.error('Error connecting to NWC:', error);
    ctx.sendError(ws, 'invalid_nwc_uri', 'Failed to connect to NWC wallet.');
    return;
  }

  // Create room
  const room = roomManager.create(ws.clientId, nwcClient);
  clientManager.setRoom(ws.clientId, room.code);

  // Start polling for invoice payments
  invoiceManager.startPolling(room.code);

  console.log(`Room created: ${room.code} by ${ws.clientId}`);

  // Send confirmation to host
  const clientInfo = roomManager.buildClientInfo(room.code, ws.clientId);
  ctx.sendMessage(ws, 'room-created', clientInfo);
};

export const handleJoinRoom: Handler<JoinRoomPayload> = (ws, payload, ctx) => {
  const { roomManager, clientManager } = ctx;
  const roomCode = normalizeRoomCode(payload.roomCode || '');

  // Validate room code format
  if (!isValidRoomCode(roomCode)) {
    ctx.sendError(ws, 'invalid_code', 'Invalid room code format.', roomCode);
    return;
  }

  // Check if already in a room
  if (clientManager.isInRoom(ws.clientId)) {
    ctx.sendError(ws, 'already_in_room', 'You are already in a room. Leave first.', roomCode);
    return;
  }

  // Check if room exists
  if (!roomManager.exists(roomCode)) {
    ctx.sendError(ws, 'room_not_found', 'Room not found.', roomCode);
    return;
  }

  // Add to room
  roomManager.addMember(roomCode, ws.clientId);
  clientManager.setRoom(ws.clientId, roomCode);

  console.log(`Client ${ws.clientId} joined room ${roomCode}`);

  // Send join confirmation to new member
  const clientInfo = roomManager.buildClientInfo(roomCode, ws.clientId);
  ctx.sendMessage(ws, 'room-joined', clientInfo);

  const message = createMessage('user-joined', { roomCode, clientId: ws.clientId });

  // Notify other room members
  ctx.broadcastToRoom(roomCode, message, ws.clientId);
};

export const handleLeaveRoom: Handler<LeaveRoomPayload> = (ws, payload, ctx) => {
  const { clientManager } = ctx;
  const roomCode = normalizeRoomCode(payload.roomCode || '');

  const currentRoom = clientManager.getRoom(ws.clientId);
  if (!currentRoom || currentRoom !== roomCode) {
    ctx.sendError(ws, 'not_in_room', 'You are not in this room.', roomCode);
    return;
  }

  removeClientFromRoom(ws.clientId, roomCode, ctx);
};

export const handleCloseRoom: Handler<CloseRoomPayload> = (ws, payload, ctx) => {
  const { roomManager } = ctx;
  const roomCode = normalizeRoomCode(payload.roomCode || '');

  if (!roomManager.exists(roomCode)) {
    ctx.sendError(ws, 'room_not_found', 'Room not found.', roomCode);
    return;
  }

  if (!roomManager.isHost(roomCode, ws.clientId)) {
    ctx.sendError(ws, 'not_host', 'Only the host can close the room.', roomCode);
    return;
  }

  closeRoom(roomCode, 'host_closed', ctx);
};

export const handleRoomMessage: Handler<RoomMessagePayload> = (ws, payload, ctx) => {
  const { roomManager, clientManager } = ctx;
  const roomCode = normalizeRoomCode(payload.roomCode || '');

  const currentRoom = clientManager.getRoom(ws.clientId);
  if (!currentRoom || currentRoom !== roomCode) {
    ctx.sendError(ws, 'not_in_room', 'You are not in this room.', roomCode);
    return;
  }

  const room = roomManager.get(roomCode);
  if (!room) {
    ctx.sendError(ws, 'room_not_found', 'Room not found.', roomCode);
    return;
  }

  const message = createMessage('room-message', {
    roomCode,
    senderId: ws.clientId,
    content: payload.content,
    isHost: roomManager.isHost(roomCode, ws.clientId),
  });

  // Broadcast to all room members (including sender)
  ctx.broadcastToRoom(roomCode, message);
};

// Helper functions for room management
export function removeClientFromRoom(clientId: string, roomCode: string, ctx: HandlerContext): void {
  const { roomManager, clientManager, invoiceManager } = ctx;

  const room = roomManager.get(roomCode);
  if (!room) return;

  // Remove from room
  roomManager.removeMember(roomCode, clientId);
  clientManager.clearRoom(clientId);

  // Send leave confirmation
  const ws = clientManager.get(clientId);
  if (ws) {
    ctx.sendMessage(ws, 'room-left', { roomCode });
  }

  console.log(`Client ${clientId} left room ${roomCode}`);

  // Check if host left - close the room
  if (room.hostId === clientId) {
    closeRoom(roomCode, 'host_disconnected', ctx);
    return;
  }

  // Check if room is empty
  if (roomManager.isEmpty(roomCode)) {
    closeRoom(roomCode, 'all_left', ctx);
    return;
  }

  // Notify remaining members
  ctx.broadcastToRoom(roomCode, createMessage('user-left', { roomCode, clientId }));
}

export function closeRoom(roomCode: string, reason: 'host_closed' | 'host_disconnected' | 'all_left', ctx: HandlerContext): void {
  const { roomManager, clientManager, invoiceManager } = ctx;

  const room = roomManager.get(roomCode);
  if (!room) return;

  console.log(`Closing room ${roomCode}: ${reason}`);

  // Stop polling
  invoiceManager.stopPolling(roomCode);

  // Notify all members before deleting
  const members = roomManager.getMembers(roomCode);
  members.forEach((memberId) => {
    clientManager.clearRoom(memberId);
    clientManager.send(
      memberId,
      JSON.stringify({
        type: 'room-closed',
        payload: { roomCode, reason },
      })
    );
  });

  // Delete room (this cleans up NWC client and interval)
  roomManager.delete(roomCode);
}

export function handleDisconnect(ws: ExtendedWebSocket, ctx: HandlerContext): void {
  const { clientManager } = ctx;

  console.log(`Client disconnected: ${ws.clientId}`);

  // Handle room cleanup if client was in a room
  const roomCode = clientManager.getRoom(ws.clientId);
  if (roomCode) {
    removeClientFromRoom(ws.clientId, roomCode, ctx);
  }

  // Remove from clients map
  clientManager.remove(ws.clientId);
}
