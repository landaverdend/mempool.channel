import { ClientRequest } from '@mempool/shared';
import { NWCClient } from '@getalby/sdk';

export interface PendingInvoice {
  paymentHash: string;
  invoice: string;
  amount: number;
  description: string;
  createdAt: number;
  expiresAt: number;
  roomCode: string;
  requesterId: string; // client who requested the invoice
  requesterUrl: string; // URL that the requester wants to queue
}

export interface Room {
  code: string;
  hostId: string;
  hostToken: string; // Token for host to rejoin after disconnect
  members: string[];
  createdAt: number;

  currentlyPlaying: ClientRequest | null;
  requestQueue: ClientRequest[];
  playedRequests: ClientRequest[];

  pendingInvoices: PendingInvoice[];

  // NWC client - only kept in memory for room duration
  nwcClient: NWCClient;
  // Interval for polling invoice status
  pollInterval?: ReturnType<typeof setInterval>;

  // Grace period for host reconnection
  hostDisconnected: boolean;
  gracePeriodTimeout?: ReturnType<typeof setTimeout>;
}
