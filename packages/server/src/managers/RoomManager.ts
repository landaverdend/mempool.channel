import { NWCClient } from '@getalby/sdk';
import { ClientRequest, ClientRoomInfo, Client } from '@mempool/shared';
import { Room, PendingInvoice } from '../types.js';
import { generateRoomCode, generateId } from '@mempool/shared';
import { insertSortedDescending } from '../utils.js';
import { ClientManager } from './ClientManager.js';

const GRACE_PERIOD_MS = 5 * 60 * 1000; // 5 minutes
// const GRACE_PERIOD_MS = 10 * 1000;

export type RoomCloseReason = 'host_closed' | 'host_disconnected' | 'all_left';

export class RoomManager {
  private rooms = new Map<string, Room>();

  create(hostId: string, nwcClient: NWCClient): Room {
    let roomCode: string;
    do {
      roomCode = generateRoomCode();
    } while (this.rooms.has(roomCode));

    const room: Room = {
      code: roomCode,
      hostId,
      hostToken: generateId() + generateId(), // Longer token for security
      members: [hostId],
      createdAt: Date.now(),
      currentlyPlaying: null,
      requestQueue: [],
      pendingInvoices: [],
      playedRequests: [],
      nwcClient,
      hostDisconnected: false,
    };

    this.rooms.set(roomCode, room);
    return room;
  }

  get(roomCode: string): Room | undefined {
    return this.rooms.get(roomCode);
  }

  exists(roomCode: string): boolean {
    return this.rooms.has(roomCode);
  }

  delete(roomCode: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    // Clean up grace period timeout if exists
    if (room.gracePeriodTimeout) {
      clearTimeout(room.gracePeriodTimeout);
    }

    // Clean up resources
    if (room.pollInterval) {
      clearInterval(room.pollInterval);
    }

    try {
      room.nwcClient.close();
    } catch (err) {
      console.error('Error closing NWC client:', err);
    }

    this.rooms.delete(roomCode);
    return true;
  }

  // Grace period management for host reconnection
  startGracePeriod(roomCode: string, onExpire: () => void): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    room.hostDisconnected = true;
    room.gracePeriodTimeout = setTimeout(() => {
      console.log(`Grace period expired for room ${roomCode}`);
      onExpire();
    }, GRACE_PERIOD_MS);

    console.log(`Grace period started for room ${roomCode} (${GRACE_PERIOD_MS / 1000}s)`);
    return true;
  }

  cancelGracePeriod(roomCode: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    if (room.gracePeriodTimeout) {
      clearTimeout(room.gracePeriodTimeout);
      room.gracePeriodTimeout = undefined;
    }
    room.hostDisconnected = false;
    return true;
  }

  // Host rejoin - update hostId to new client
  rejoinAsHost(roomCode: string, newHostId: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    room.hostId = newHostId;
    room.hostDisconnected = false;

    // Add new host to members if not already there
    if (!room.members.includes(newHostId)) {
      room.members.push(newHostId);
    }

    return true;
  }

  validateHostToken(roomCode: string, token: string): boolean {
    const room = this.rooms.get(roomCode);
    return room?.hostToken === token;
  }

  isHostDisconnected(roomCode: string): boolean {
    const room = this.rooms.get(roomCode);
    return room?.hostDisconnected ?? false;
  }

  getHostToken(roomCode: string): string | undefined {
    return this.rooms.get(roomCode)?.hostToken;
  }

  addMember(roomCode: string, clientId: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;
    room.members.push(clientId);
    return true;
  }

  removeMember(roomCode: string, clientId: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;
    room.members = room.members.filter((id) => id !== clientId);
    return true;
  }

  getMembers(roomCode: string): string[] {
    return this.rooms.get(roomCode)?.members ?? [];
  }

  isHost(roomCode: string, clientId: string): boolean {
    const room = this.rooms.get(roomCode);
    return room?.hostId === clientId;
  }

  isEmpty(roomCode: string): boolean {
    const room = this.rooms.get(roomCode);
    return !room || room.members.length === 0;
  }

  // Queue management
  addToQueue(roomCode: string, request: ClientRequest): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    // If there is nothing currently playing, set request as currently playing
    if (!room.currentlyPlaying) {
      room.currentlyPlaying = request;
      return true;
    }

    insertSortedDescending(room.requestQueue, request);
    return true;
  }

  getNextFromQueue(roomCode: string): ClientRequest | undefined {
    const room = this.rooms.get(roomCode);
    return room?.requestQueue.shift();
  }

  // Playback management
  setCurrentlyPlaying(roomCode: string, playing: Room['currentlyPlaying']): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;
    room.currentlyPlaying = playing;
    return true;
  }

  addToPlayedRequests(roomCode: string, request: ClientRequest): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;
    room.playedRequests.push(request);
    return true;
  }

  // Invoice management
  addPendingInvoice(roomCode: string, invoice: PendingInvoice): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;
    room.pendingInvoices.push(invoice);
    return true;
  }

  removePendingInvoice(roomCode: string, index: number): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;
    room.pendingInvoices.splice(index, 1);
    return true;
  }

  setPollInterval(roomCode: string, interval: ReturnType<typeof setInterval>): void {
    const room = this.rooms.get(roomCode);
    if (room) {
      room.pollInterval = interval;
    }
  }

  // Build client-facing room info
  buildClientInfo(roomCode: string, clientId: string, clientManager: ClientManager): ClientRoomInfo | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    // Build Client objects with names for each member
    const members: Client[] = room.members
      .map((memberId) => clientManager.getClient(memberId))
      .filter((client): client is Client => client !== undefined);

    return {
      roomCode: room.code,
      isHost: room.hostId === clientId,
      members,
      currentlyPlaying: room.currentlyPlaying,
      playedRequests: room.playedRequests,
      requestQueue: room.requestQueue,
    };
  }

  // Get all room codes (for iteration)
  getAllRoomCodes(): string[] {
    return Array.from(this.rooms.keys());
  }
}
