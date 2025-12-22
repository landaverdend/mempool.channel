import { WebSocket } from 'ws';

export interface ExtendedWebSocket extends WebSocket {
  clientId: string;
}

export class ClientManager {
  private clients = new Map<string, ExtendedWebSocket>();
  private clientRooms = new Map<string, string>(); // clientId -> roomCode

  add(clientId: string, ws: ExtendedWebSocket): void {
    this.clients.set(clientId, ws);
  }

  remove(clientId: string): void {
    this.clients.delete(clientId);
    this.clientRooms.delete(clientId);
  }

  get(clientId: string): ExtendedWebSocket | undefined {
    return this.clients.get(clientId);
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
    const ws = this.clients.get(clientId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
      return true;
    }
    return false;
  }
}
