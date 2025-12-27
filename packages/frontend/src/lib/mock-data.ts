import { ClientRequest, ClientRoomInfo, Client } from '@mempool/shared';
import { RoomMessage } from '@/contexts/websocketContext';

const members: Client[] = [
  { clientId: 'client_abc123', name: 'Alice' },
  { clientId: 'client_def456', name: 'Bob' },
  { clientId: 'client_ghi789', name: 'Charlie' },
];

const generateMockRequests = (clients: Client[], count: number = 10) => {
  const requests: ClientRequest[] = [];
  for (let i = 0; i < count; i++) {
    const client = clients[i % clients.length];
    requests.push({
      createdAt: Date.now() - i * 1000,
      amount: Math.floor(Math.random() * 10000),
      url: `https://www.youtube.com/watch?v=xIthgcx-axs`,
      requesterId: client.clientId,
      requesterName: client.name,
    });
  }
  // Sort by amount descending - highest paying requests first
  return requests.sort((a, b) => b.amount - a.amount);
};

const currentlyPlaying: ClientRequest = {
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  createdAt: Date.now() - 60000,
  requesterId: 'client_def456',
  requesterName: 'Bob',
  amount: 2100,
};

export const MOCK_ROOM_STATE: ClientRoomInfo = {
  roomCode: 'DEMO42',
  isHost: true,
  members: members,
  currentlyPlaying: currentlyPlaying,
  requestQueue: [...generateMockRequests(members, 10)],
  playedRequests: [...generateMockRequests(members, 10)],
};

export const MOCK_ROOM_MESSAGES: RoomMessage[] = [
  {
    id: 'msg_1',
    senderId: 'client_abc123',
    content: 'Hey everyone!',
    senderName: 'Alice',
    isHost: true,
    timestamp: Date.now() - 300000,
  },
  {
    id: 'msg_2',
    senderId: 'client_def456',
    content: 'Just queued up a banger',
    senderName: 'Bob',
    isHost: false,
    timestamp: Date.now() - 240000,
  },
  {
    id: 'msg_3',
    senderId: 'client_ghi789',
    content: 'Nice! Love this song',
    senderName: 'Charlie',
    isHost: false,
    timestamp: Date.now() - 180000,
  },
];
