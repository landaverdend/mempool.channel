import { ClientRequest, ClientRoomInfo } from '@mempool/shared';
import { RoomMessage } from '@/contexts/websocket-context';

const generateMockRequests = (clientIds: string[], count: number = 10) => {
  const requests: ClientRequest[] = [];
  for (let i = 0; i < count; i++) {
    requests.push({
      createdAt: Date.now() - i * 1000,
      amount: Math.floor(Math.random() * 10000),
      url: `https://www.youtube.com/watch?v=xIthgcx-axs`,
      requesterId: clientIds[i % clientIds.length],
    });
  }
  // Sort by amount descending - highest paying requests first
  return requests.sort((a, b) => b.amount - a.amount);
};

const members = ['client_abc123', 'client_def456', 'client_ghi789'];

export const MOCK_ROOM_STATE: ClientRoomInfo = {
  roomCode: 'DEMO42',
  isHost: true,
  members: members,
  currentlyPlaying: {
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'Rick Astley - Never Gonna Give You Up',
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    startedAt: Date.now() - 60000,
    requesterId: 'client_def456',
    amount: 2100,
  },
  requestQueue: [...generateMockRequests(members, 10)],
  playedRequests: [...generateMockRequests(members, 10)],
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
