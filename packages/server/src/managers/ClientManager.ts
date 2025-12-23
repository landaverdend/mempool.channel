import { WebSocket } from 'ws';
import { Client } from '@mempool/shared';

export interface ExtendedWebSocket extends WebSocket {
  clientId: string;
}

export interface ConnectedClient extends Client {
  ws: ExtendedWebSocket;
}

export class ClientManager {
  private clients = new Map<string, ConnectedClient>();
  private clientRooms = new Map<string, string>(); // clientId -> roomCode

  add(clientId: string, ws: ExtendedWebSocket, name: string = ''): void {
    this.clients.set(clientId, { clientId, name, ws });
  }

  remove(clientId: string): void {
    this.clients.delete(clientId);
    this.clientRooms.delete(clientId);
  }

  get(clientId: string): ConnectedClient | undefined {
    return this.clients.get(clientId);
  }

  getWebSocket(clientId: string): ExtendedWebSocket | undefined {
    return this.clients.get(clientId)?.ws;
  }

  getName(clientId: string): string | undefined {
    return this.clients.get(clientId)?.name;
  }

  setName(clientId: string, name: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.name = name;
    }
  }

  getClient(clientId: string): Client | undefined {
    const connected = this.clients.get(clientId);
    if (!connected) return undefined;
    return { clientId: connected.clientId, name: connected.name };
  }

  getRoom(clientId: string): string | undefined {
    return this.clientRooms.get(clientId);
  }

  setRoom(clientId: string, roomCode: string): void {
    this.clientRooms.set(clientId, roomCode);
  }

  clearRoom(clientId: string): void {
    this.clientRooms.delete(clientId);
  }

  isInRoom(clientId: string): boolean {
    return this.clientRooms.has(clientId);
  }

  send(clientId: string, data: string): boolean {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
      return true;
    }
    return false;
  }
}
