import { useCallback, useMemo } from 'react';
import { useWebSocket, RoomMessage, InvoiceState } from '@/contexts/websocketContext';
import { useDemo } from '@/contexts/demoContext';
import { ClientRoomInfo, MakeRequestPayload } from '@mempool/shared';
import { useNavigate } from 'react-router-dom';

/**
 * Unified hook for room functionality that works in both demo and real modes.
 * This hook abstracts away the underlying context (demo vs websocket) and provides
 * a consistent interface for all room-related operations.
 */
export function useRoom() {
  const navigate = useNavigate();

  // Get data from both contexts
  const websocket = useWebSocket();
  const demo = useDemo();

  const { isDemoMode, demoRoomState, demoRoomMessages, demoClientId } = demo;
  const { demoPlayNext, demoSendMessage, demoAddRequest, exitDemoMode } = demo;

  // Determine which state to use
  const roomState: ClientRoomInfo = isDemoMode ? demoRoomState : websocket.roomState;
  const roomMessages: RoomMessage[] = isDemoMode ? demoRoomMessages : websocket.roomMessages;
  const clientId: string | null = isDemoMode ? demoClientId : websocket.clientId;
  const connected: boolean = isDemoMode ? true : websocket.connected;
  const error: string | null = isDemoMode ? null : websocket.error;
  const hostAway: boolean = isDemoMode ? false : websocket.hostAway;

  // Invoice state (demo mode simulates instant payment)
  const invoiceState: InvoiceState = isDemoMode
    ? { invoice: null, loading: false, paid: false }
    : websocket.invoiceState;

  // Room actions that work in both modes
  const playNext = useCallback(() => {
    if (isDemoMode) {
      demoPlayNext();
    } else {
      websocket.playNext();
    }
  }, [isDemoMode, demoPlayNext, websocket]);

  const sendRoomMessage = useCallback((content: string) => {
    if (isDemoMode) {
      demoSendMessage(content);
    } else {
      websocket.sendRoomMessage(content);
    }
  }, [isDemoMode, demoSendMessage, websocket]);

  const addRequest = useCallback((url: string, amount: number) => {
    if (isDemoMode) {
      demoAddRequest(url, amount);
    } else {
      websocket.addRequest(url, amount);
    }
  }, [isDemoMode, demoAddRequest, websocket]);

  const makeRequest = useCallback((payload: MakeRequestPayload) => {
    if (isDemoMode) {
      // In demo mode, simulate adding to queue directly
      demoAddRequest(payload.url, payload.amount);
    } else {
      websocket.makeRequest(payload);
    }
  }, [isDemoMode, demoAddRequest, websocket]);

  const leaveRoom = useCallback(() => {
    if (isDemoMode) {
      exitDemoMode();
      navigate('/');
    } else {
      websocket.leaveRoom();
      navigate('/');
    }
  }, [isDemoMode, exitDemoMode, websocket, navigate]);

  const closeRoom = useCallback(() => {
    if (isDemoMode) {
      exitDemoMode();
      navigate('/');
    } else {
      websocket.closeRoom();
      navigate('/');
    }
  }, [isDemoMode, exitDemoMode, websocket, navigate]);

  const clearError = useCallback(() => {
    if (!isDemoMode) {
      websocket.clearError();
    }
  }, [isDemoMode, websocket]);

  const clearInvoice = useCallback(() => {
    if (!isDemoMode) {
      websocket.clearInvoice();
    }
  }, [isDemoMode, websocket]);

  return useMemo(() => ({
    // State
    isDemoMode,
    connected,
    clientId,
    roomState,
    roomMessages,
    invoiceState,
    error,
    hostAway,

    // Actions
    playNext,
    sendRoomMessage,
    addRequest,
    makeRequest,
    leaveRoom,
    closeRoom,
    clearError,
    clearInvoice,
  }), [
    isDemoMode,
    connected,
    clientId,
    roomState,
    roomMessages,
    invoiceState,
    error,
    hostAway,
    playNext,
    sendRoomMessage,
    addRequest,
    makeRequest,
    leaveRoom,
    closeRoom,
    clearError,
    clearInvoice,
  ]);
}
