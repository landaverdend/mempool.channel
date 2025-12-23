import { RoomManager } from './RoomManager.js';
import { ClientManager } from './ClientManager.js';

export class InvoiceManager {
  private pollIntervals = new Map<string, ReturnType<typeof setInterval>>();

  constructor(
    private roomManager: RoomManager,
    private clientManager: ClientManager,
    private broadcastToRoom: (roomCode: string, type: string, payload: unknown) => void,
    private broadcastToClient: (roomCode: string, clientId: string, type: string, payload: unknown) => void
  ) {}

  startPolling(roomCode: string, intervalMs: number = 3000): void {
    if (this.pollIntervals.has(roomCode)) return;

    const interval = setInterval(() => this.pollInvoices(roomCode), intervalMs);
    this.pollIntervals.set(roomCode, interval);
    this.roomManager.setPollInterval(roomCode, interval);
  }

  stopPolling(roomCode: string): void {
    const interval = this.pollIntervals.get(roomCode);
    if (interval) {
      clearInterval(interval);
      this.pollIntervals.delete(roomCode);
    }
  }

  private async pollInvoices(roomCode: string): Promise<void> {
    const room = this.roomManager.get(roomCode);
    if (!room || room.pendingInvoices.length === 0) return;

    const now = Math.floor(Date.now() / 1000);

    console.log('Polling invoices for room: ', roomCode);

    // Process each pending invoice (iterate backwards for safe removal)
    for (let i = room.pendingInvoices.length - 1; i >= 0; i--) {
      const pending = room.pendingInvoices[i];

      // Remove expired invoices
      if (pending.expiresAt < now) {
        this.roomManager.removePendingInvoice(roomCode, i);
        console.log(`Invoice expired: ${pending.paymentHash.substring(0, 8)}...`);
        continue;
      }

      // Check payment status
      try {
        const lookup = await room.nwcClient.lookupInvoice({
          payment_hash: pending.paymentHash,
        });

        console.log('Invoice Lookup: ', lookup);

        if (lookup.settled_at || lookup.state === 'settled' || lookup.state === 'accepted') {
          // Invoice paid - remove from pending
          this.roomManager.removePendingInvoice(roomCode, i);
          console.log(`Invoice paid: ${pending.paymentHash.substring(0, 8)}...`);

          // Add to the request queue
          this.roomManager.addToQueue(roomCode, {
            createdAt: Math.floor(Date.now() / 1000),
            amount: pending.amount,
            url: pending.requesterUrl,
            requesterId: pending.requesterId,
          });

          // Broadcast the updated room info
          const clientInfo = this.roomManager.buildClientInfo(roomCode, pending.requesterId);
          if (clientInfo) {
            this.broadcastToRoom(roomCode, 'item-queued', clientInfo);
          }

          // Broadcast to the requester that their invoice has been paid
          this.broadcastToClient(room.code, pending.requesterId, 'invoice-paid', {
            roomCode: room.code,
            clientId: pending.requesterId,
            success: true,
            url: pending.requesterUrl,
            amount: pending.amount,
          });
        }

        if (lookup.state === 'failed') {
          // Invoice failed - remove from pending
          this.roomManager.removePendingInvoice(roomCode, i);
          console.log(`Invoice failed: ${pending.paymentHash.substring(0, 8)}...`);

          // Broadcast to the requester that their invoice has failed
          this.broadcastToClient(room.code, pending.requesterId, 'invoice-paid', {
            roomCode: room.code,
            clientId: pending.requesterId,
            success: false,
            url: pending.requesterUrl,
            amount: pending.amount,
          });
        }
      } catch (err) {
        console.error(`Error checking invoice ${pending.paymentHash.substring(0, 8)}:`, err);
      }
    }
  }
}
