import { ClientRequest } from "@mempool/shared";
import { NWCClient } from "@getalby/sdk";

export interface Room {
  code: string;
  hostId: string;
  members: string[];
  createdAt: number;

  settledRequests: ClientRequest[];
  pendingRequests: ServerRequest[];

  // NWC client - only kept in memory for room duration
  nwcClient: NWCClient;
}

export interface ServerRequest {
  createdAt: number;
  amount: number;
  lnUrl: string; // LN URL to be used in invoice
  url: string;
  roomCode: string;
}
