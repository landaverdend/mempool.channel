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
}

export interface Room {
  code: string;
  hostId: string;
  members: string[];
  createdAt: number;

  settledRequests: ClientRequest[];
  pendingInvoices: PendingInvoice[];

  // NWC client - only kept in memory for room duration
  nwcClient: NWCClient;
  // Interval for polling invoice status
  pollInterval?: ReturnType<typeof setInterval>;
}