import { PlayNextPayload, SkipCurrentPayload, normalizeRoomCode } from '@mempool/shared';
import { Handler } from './types.js';

export const handlePlayNext: Handler<PlayNextPayload> = (ws, payload, ctx) => {
  const { roomManager, clientManager } = ctx;
  const roomCode = normalizeRoomCode(payload.roomCode || '');

  const room = roomManager.get(roomCode);
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
      createdAt: room.currentlyPlaying.startedAt,
      amount: room.currentlyPlaying.amount,
      url: room.currentlyPlaying.url,
      requesterId: room.currentlyPlaying.requesterId,
    });
  }

  // Get next from queue
  const nextRequest = roomManager.getNextFromQueue(roomCode);
  if (!nextRequest) {
    roomManager.setCurrentlyPlaying(roomCode, null);
  } else {
    roomManager.setCurrentlyPlaying(roomCode, {
      url: nextRequest.url,
      title: payload.title,
      thumbnail: payload.thumbnail,
      startedAt: Date.now(),
      requesterId: nextRequest.requesterId,
      amount: nextRequest.amount,
    });
  }

  const updatedRoom = roomManager.get(roomCode);
  console.log(`Now playing in ${roomCode}: ${updatedRoom?.currentlyPlaying?.title || 'nothing'}`);

  // Broadcast updated state to all room members
  const members = roomManager.getMembers(roomCode);
  members.forEach((memberId) => {
    const clientInfo = roomManager.buildClientInfo(roomCode, memberId);
    if (clientInfo) {
      clientManager.send(
        memberId,
        JSON.stringify({ type: 'now-playing', payload: clientInfo })
      );
    }
  });
};

export const handleSkipCurrent: Handler<SkipCurrentPayload> = (ws, payload, ctx) => {
  const { roomManager, clientManager } = ctx;
  const roomCode = normalizeRoomCode(payload.roomCode || '');

  const room = roomManager.get(roomCode);
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
      createdAt: room.currentlyPlaying.startedAt,
      amount: room.currentlyPlaying.amount,
      url: room.currentlyPlaying.url,
      requesterId: room.currentlyPlaying.requesterId,
    });
    roomManager.setCurrentlyPlaying(roomCode, null);
  }

  console.log(`Skipped current song in ${roomCode}`);

  // Broadcast updated state to all room members
  const members = roomManager.getMembers(roomCode);
  members.forEach((memberId) => {
    const clientInfo = roomManager.buildClientInfo(roomCode, memberId);
    if (clientInfo) {
      clientManager.send(
        memberId,
        JSON.stringify({ type: 'now-playing', payload: clientInfo })
      );
    }
  });
};
