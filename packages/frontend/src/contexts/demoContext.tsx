import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import { ClientRoomInfo, ClientRequest } from '@mempool/shared';
import { RoomMessage } from './websocketContext';

// Demo room configuration
const DEMO_ROOM_CODE = 'DEMO42';
const DEMO_CLIENT_ID = 'demo_host_123';

// Sample YouTube videos for demo
const DEMO_VIDEOS = [
  { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { url: 'https://www.youtube.com/watch?v=DsC8jQXRbQE' },
  { url: 'https://www.youtube.com/watch?v=hE66C4cUJJY' },
  { url: 'https://www.youtube.com/watch?v=an1IV6Oyvuc' },
  { url: 'https://www.youtube.com/watch?v=t-5H-mMXH_4' },
  { url: 'https://www.youtube.com/watch?v=kAjLAyVyWvg' },
];

const DEMO_MEMBERS = [
  { clientId: DEMO_CLIENT_ID, name: 'You (Host)' },
  { clientId: 'demo_user_1', name: 'Alice' },
  { clientId: 'demo_user_2', name: 'Bob' },
  { clientId: 'demo_user_3', name: 'Charlie' },
];

const DEMO_NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];

function getRandomName(): string {
  return DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)];
}

function getRandomVideo() {
  return DEMO_VIDEOS[Math.floor(Math.random() * DEMO_VIDEOS.length)];
}

function generateDemoRequest(requesterName?: string): ClientRequest {
  const video = getRandomVideo();
  const name = requesterName || getRandomName();
  return {
    url: video.url,
    createdAt: Date.now(),
    requesterId: `demo_user_${Math.random().toString(36).substr(2, 9)}`,
    requesterName: name,
    amount: Math.floor(Math.random() * 5000) + 100,
  };
}

function createInitialDemoState(): ClientRoomInfo {
  const initialQueue: ClientRequest[] = [
    {
      url: 'https://www.youtube.com/watch?v=DsC8jQXRbQE',
      createdAt: Date.now() - 30000,
      requesterId: 'demo_user_1',
      requesterName: 'Alice',
      amount: 2100,
    },
    {
      url: 'https://www.youtube.com/watch?v=hE66C4cUJJY',
      createdAt: Date.now() - 20000,
      requesterId: 'demo_user_2',
      requesterName: 'Bob',
      amount: 1500,
    },
    {
      url: 'https://www.youtube.com/watch?v=an1IV6Oyvuc',
      createdAt: Date.now() - 10000,
      requesterId: 'demo_user_3',
      requesterName: 'Charlie',
      amount: 800,
    },
  ].sort((a, b) => b.amount - a.amount);

  return {
    roomCode: DEMO_ROOM_CODE,
    isHost: true,
    members: DEMO_MEMBERS,
    currentlyPlaying: {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      createdAt: Date.now() - 60000,
      requesterId: 'demo_user_1',
      requesterName: 'Alice',
      amount: 6969,
    },
    requestQueue: initialQueue,
    playedRequests: [
      {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        createdAt: Date.now() - 60000,
        requesterId: 'demo_user_1',
        requesterName: getRandomName(),
        amount: Math.floor(Math.random() * 5000) + 100,
      },
      {
        url: 'https://www.youtube.com/watch?v=DsC8jQXRbQE',
        createdAt: Date.now() - 60000,
        requesterId: 'demo_user_1',
        requesterName: getRandomName(),
        amount: Math.floor(Math.random() * 5000) + 100,
      },
    ],
  };
}

function createInitialDemoMessages(): RoomMessage[] {
  return [
    {
      id: 'demo_msg_1',
      senderId: 'demo_user_1',
      senderName: 'Alice',
      content: 'Welcome to the demo! This is a simulated listening party.',
      isHost: false,
      timestamp: Date.now() - 120000,
    },
    {
      id: 'demo_msg_2',
      senderId: DEMO_CLIENT_ID,
      senderName: 'You (Host)',
      content: 'Thanks for checking out mempool.channel!',
      isHost: true,
      timestamp: Date.now() - 60000,
    },
    {
      id: 'demo_msg_3',
      senderId: 'demo_user_2',
      senderName: 'Bob',
      content: 'This joke is so funny and never gets old! Play it again!',
      isHost: false,
      timestamp: Date.now() - 30000,
    },
  ];
}

interface DemoContextValue {
  // Demo state
  isDemoMode: boolean;
  demoRoomState: ClientRoomInfo;
  demoRoomMessages: RoomMessage[];
  demoClientId: string;

  // Demo actions
  enterDemoMode: () => void;
  exitDemoMode: () => void;

  // Simulated room actions
  demoPlayNext: () => void;
  demoSendMessage: (content: string) => void;
  demoAddRequest: (url: string, amount: number) => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoRoomState, setDemoRoomState] = useState<ClientRoomInfo>(createInitialDemoState());
  const [demoRoomMessages, setDemoRoomMessages] = useState<RoomMessage[]>(createInitialDemoMessages());

  // Intervals for simulated activity
  const activityIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSimulatedActivity = useCallback(() => {
    // Simulate random activity every 8-15 seconds
    activityIntervalRef.current = setInterval(() => {
      const action = Math.random();

      if (action < 0.4) {
        // 40% chance: new song request
        const newRequest = generateDemoRequest();
        setDemoRoomState((prev) => ({
          ...prev,
          requestQueue: [...prev.requestQueue, newRequest].sort((a, b) => b.amount - a.amount),
        }));
      } else if (action < 0.7) {
        // 30% chance: new chat message
        const messages = [
          'Wow I have never heard this song before, play it again!',
          'Can we play some more of this?',
          'I could listen to this all day!',
          'This is my favorite song!',
          'I love this song!',
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        const senderName = getRandomName();

        setDemoRoomMessages((prev) => [
          ...prev,
          {
            id: `demo_msg_${Date.now()}`,
            senderId: `demo_user_${Math.random().toString(36).substr(2, 9)}`,
            senderName,
            content: randomMessage,
            isHost: false,
            timestamp: Date.now(),
          },
        ]);
      } else if (action < 0.85) {
        // 15% chance: user joins
        const newMember = {
          clientId: `demo_user_${Math.random().toString(36).substr(2, 9)}`,
          name: getRandomName(),
        };
        setDemoRoomState((prev) => ({
          ...prev,
          members: [...prev.members, newMember],
        }));
      }
      // 15% chance: nothing happens
    }, 8000 + Math.random() * 7000);
  }, []);

  const stopSimulatedActivity = useCallback(() => {
    if (activityIntervalRef.current) {
      clearInterval(activityIntervalRef.current);
      activityIntervalRef.current = null;
    }
  }, []);

  const enterDemoMode = useCallback(() => {
    setIsDemoMode(true);
    setDemoRoomState(createInitialDemoState());
    setDemoRoomMessages(createInitialDemoMessages());
    startSimulatedActivity();
  }, [startSimulatedActivity]);

  const exitDemoMode = useCallback(() => {
    setIsDemoMode(false);
    stopSimulatedActivity();
    setDemoRoomState(createInitialDemoState());
    setDemoRoomMessages(createInitialDemoMessages());
  }, [stopSimulatedActivity]);

  const demoPlayNext = useCallback(() => {
    setDemoRoomState((prev) => {
      if (prev.requestQueue.length === 0) return prev;

      const [nextSong, ...remainingQueue] = prev.requestQueue;
      const playedRequests = prev.currentlyPlaying ? [prev.currentlyPlaying, ...prev.playedRequests] : prev.playedRequests;

      return {
        ...prev,
        currentlyPlaying: nextSong,
        requestQueue: remainingQueue,
        playedRequests,
      };
    });
  }, []);

  const demoSendMessage = useCallback((content: string) => {
    if (!content.trim()) return;

    setDemoRoomMessages((prev) => [
      ...prev,
      {
        id: `demo_msg_${Date.now()}`,
        senderId: DEMO_CLIENT_ID,
        senderName: 'You (Host)',
        content: content.trim(),
        isHost: true,
        timestamp: Date.now(),
      },
    ]);
  }, []);

  const demoAddRequest = useCallback((url: string, amount: number) => {
    const newRequest: ClientRequest = {
      url,
      createdAt: Date.now(),
      requesterId: DEMO_CLIENT_ID,
      requesterName: 'You (Host)',
      amount,
    };

    setDemoRoomState((prev) => ({
      ...prev,
      requestQueue: [...prev.requestQueue, newRequest].sort((a, b) => b.amount - a.amount),
    }));
  }, []);

  const value: DemoContextValue = {
    isDemoMode,
    demoRoomState,
    demoRoomMessages,
    demoClientId: DEMO_CLIENT_ID,
    enterDemoMode,
    exitDemoMode,
    demoPlayNext,
    demoSendMessage,
    demoAddRequest,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
