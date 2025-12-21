import { ClientRoomInfo } from '@mempool/shared';
import { RoomMessage } from '@/contexts/websocket-context';

export const MOCK_ROOM_STATE: ClientRoomInfo = {
  roomCode: 'DEMO42',
  isHost: true,
  members: ['client_abc123', 'client_def456', 'client_ghi789'],
  requestQueue: [
    {
      createdAt: Date.now() - 120000,
      amount: 1000,
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      requesterId: 'client_def456',
    },
    {
      createdAt: Date.now() - 60000,
      amount: 2100,
      url: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
      requesterId: 'client_ghi789',
    },
    {
      createdAt: Date.now() - 30000,
      amount: 500,
      url: 'https://soundcloud.com/someartist/sometrack',
      requesterId: 'client_abc123',
    },
    {
      createdAt: Date.now() - 10000,
      amount: 5000,
      url: 'https://www.youtube.com/watch?v=abc123xyz',
      requesterId: 'client_def456',
    },
  ],
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

export const MOCK_INVOICE =
  'lnbc21000n1pnxxx...mockInvoiceForDevMode...xxxEndOfMockInvoice';
