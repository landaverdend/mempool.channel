import { createMessage, MakeRequestPayload, normalizeRoomCode } from '@mempool/shared';
import { Handler } from './types.js';

export const handleMakeRequest: Handler<MakeRequestPayload> = async (ws, payload, ctx) => {
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

  try {
    const invoice = await room.nwcClient.makeInvoice({
      amount: payload.amount * 1000, // Convert sats to millisats (NIP-47 uses millisats)
      description: payload.comment,
    });

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 60 * 10; // expires in 10 minutes

    // Track pending invoice for payment polling
    // NWC returns amount in millisats, convert back to sats
    const amountSats = Math.floor(invoice.amount / 1000);

    roomManager.addPendingInvoice(roomCode, {
      paymentHash: invoice.payment_hash,
      invoice: invoice.invoice,
      amount: amountSats,
      description: invoice.description || '',
      createdAt: now,
      expiresAt,
      roomCode,
      requesterId: ws.clientId,
      requesterUrl: payload.url,
    });

    ctx.sendMessage(ws, 'invoice-generated', {
      invoice: {
        pr: invoice.invoice,
        paymentHash: invoice.payment_hash,
        amount: amountSats,
        description: invoice.description,
        expiresAt,
      },
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    ctx.sendError(ws, 'invoice_error', 'Failed to create invoice.', roomCode);
  }
};

// Host Only Upload - Maybe dont
export const handleHostRequest: Handler<MakeRequestPayload> = (ws, payload, ctx) => {
  const { roomManager, clientManager } = ctx;
  const roomCode = normalizeRoomCode(payload.roomCode || '');

  const room = roomManager.get(roomCode);
  if (!room) {
    ctx.sendError(ws, 'room_not_found', 'Room not found.', roomCode);
    return;
  }

  if (!roomManager.isHost(roomCode, ws.clientId)) {
    ctx.sendError(ws, 'not_host', 'Only the host can add requests.', roomCode);
    return;
  }

  const request = {
    createdAt: Date.now(),
    amount: 0,
    url: payload.url,
    requesterId: ws.clientId,
    isHostRequest: true,
    requesterName: ctx.clientManager.getName(ws.clientId) || '',
  };

  // If nothing is currently playing, set the new request as the currently playing item. Don't add to queue
  if (room.currentlyPlaying === null) {
    roomManager.setCurrentlyPlaying(roomCode, request);
  } else {
    roomManager.addToQueue(roomCode, request);
  }

  const clientInfo = roomManager.buildClientInfo(roomCode, ws.clientId, clientManager);
  ctx.broadcastToRoom(roomCode, createMessage('item-queued', clientInfo));
};
