import { PlayNextPayload, SkipCurrentPayload, createMessage, normalizeRoomCode, serializeMessage } from '@mempool/shared';
import { Handler } from './types.js';

export const handlePlayNext: Handler<PlayNextPayload> = (ws, payload, ctx) => {
  const { roomManager, clientManager } = ctx;
  const roomCode = normalizeRoomCode(payload.roomCode || '');

  const room = roomManager.get(roomCode);
  // Check room exists
  if (!room) {
    ctx.sendError(ws, 'room_not_found', 'Room not found.', roomCode);
    return;
  }

  // Only host can control playback
  if (!roomManager.isHost(roomCode, ws.clientId)) {
    ctx.sendError(ws, 'not_host', 'Only the host can control playback.', roomCode);
    return;
  }

  // Move current song to played if exists
  if (room.currentlyPlaying) {
    roomManager.addToPlayedRequests(roomCode, {
      ...room.currentlyPlaying,
    });
  }

  // Get next from queue
  const nextRequest = roomManager.getNextFromQueue(roomCode);
  if (!nextRequest) {
    roomManager.setCurrentlyPlaying(roomCode, null);
  } else {
    roomManager.setCurrentlyPlaying(roomCode, nextRequest);
  }

  const updatedRoom = roomManager.get(roomCode);
  console.log(`Now playing in ${roomCode}: ${updatedRoom?.currentlyPlaying?.url || 'nothing'}`);

  // Broadcast updated state to all room members
  const members = roomManager.getMembers(roomCode);
  members.forEach((memberId) => {
    const clientInfo = roomManager.buildClientInfo(roomCode, memberId, clientManager);
    if (clientInfo) {
      const message = createMessage('now-playing', clientInfo);
      clientManager.send(memberId, serializeMessage(message));
    }
  });
};
