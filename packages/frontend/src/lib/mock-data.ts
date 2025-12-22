import { ClientRequest, ClientRoomInfo } from '@mempool/shared';
import { RoomMessage } from '@/contexts/websocket-context';

const generateMockRequests = (clientIds: string[], count: number = 10) => {
  const requests: ClientRequest[] = [];
  for (let i = 0; i < count; i++) {
    requests.push({
      createdAt: Date.now() - i * 1000,
      amount: Math.floor(Math.random() * 10000),
      url: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`,
      requesterId: clientIds[i % clientIds.length],
    });
  }
  return requests;
};

const members = ['client_abc123', 'client_def456', 'client_ghi789'];

export const MOCK_ROOM_STATE: ClientRoomInfo = {
  roomCode: 'DEMO42',
  isHost: true,
  members: members,
  requestQueue: [...generateMockRequests(members, 100)],
};

export const MOCK_ROOM_MESSAGES: RoomMessage[] = [
  {
    id: 'msg_1',
    senderId: 'client_abc123',
    content: 'Hey everyone!',
    isHost: true,
    timestamp: Date.now() - 300000,
  },
  {
    id: 'msg_2',
    senderId: 'client_def456',
    content: 'Just queued up a banger',
    isHost: false,
    timestamp: Date.now() - 240000,
  },
  {
    id: 'msg_3',
    senderId: 'client_ghi789',
    content: 'Nice! Love this song',
    isHost: false,
    timestamp: Date.now() - 180000,
  },
];

export const MOCK_INVOICE = 'lnbc21000n1pnxxx...mockInvoiceForDevMode...xxxEndOfMockInvoice';
