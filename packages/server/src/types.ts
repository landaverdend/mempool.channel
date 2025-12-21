import { ClientRequest } from "@mempool/shared";

export interface Room {
  code: string;
  hostId: string;
  members: string[];
  createdAt: number;

  settledRequests: ClientRequest[];
  pendingRequests: ServerRequest[];
}

export interface ServerRequest {
  createdAt: number;
  amount: number;
  lnUrl: string; // LN URL to be used in invoice
  url: string;
  roomCode: string;
}

