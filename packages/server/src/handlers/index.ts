import type { Handler } from './types.js';
import { handleCreateRoom, handleJoinRoom, handleLeaveRoom, handleCloseRoom, handleRoomMessage } from './room.js';
import { handlePlayNext, handleSkipCurrent } from './playback.js';
import { handleMakeRequest, handleAddRequest } from './requests.js';

// Handler map - maps message types to their handlers
export const handlers: Record<string, Handler> = {
  'create-room': handleCreateRoom,
  'join-room': handleJoinRoom,
  'leave-room': handleLeaveRoom,
  'close-room': handleCloseRoom,
  'room-message': handleRoomMessage,
  'play-next': handlePlayNext,
  'skip-current': handleSkipCurrent,
  'make-request': handleMakeRequest,
  'add-request': handleAddRequest,
};

export type { Handler, HandlerContext } from './types.js';
export { handleDisconnect, removeClientFromRoom, closeRoom } from './room.js';
