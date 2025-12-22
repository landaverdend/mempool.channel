import { NWCClient } from '@getalby/sdk';
import { ClientRequest, ClientRoomInfo } from '@mempool/shared';
import { Room, PendingInvoice } from '../types.js';
import { generateRoomCode } from '@mempool/shared';
import { insertSortedDescending } from '../utils.js';

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
      members: [hostId],
      createdAt: Date.now(),
      currentlyPlaying: null,
      requestQueue: [],
      pendingInvoices: [],
      playedRequests: [],
      nwcClient,
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
  buildClientInfo(roomCode: string, clientId: string): ClientRoomInfo | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    return {
      roomCode: room.code,
      isHost: room.hostId === clientId,
      members: room.members,
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
