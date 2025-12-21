import { WebSocket } from 'ws';
import { SimplePool, useWebSocketImplementation } from 'nostr-tools/pool';
import { NWCInfo } from './types.js';

useWebSocketImplementation(WebSocket);

const globalRelayPool = new SimplePool({ enablePing: true });

export function parseNWC(uri: string): NWCInfo {
  const url = new URL(uri);
  if (url.protocol !== 'nostr+walletconnect:') {
    throw new Error('Invalid NWC URI');
  }

  if (!url.hostname || !url.searchParams.get('relay') || !url.searchParams.get('secret')) {
    throw new Error('Invalid NWC URI');
  }

  return {
    walletPubkey: url.hostname,
    relay: url.searchParams.get('relay')!,
    secret: url.searchParams.get('secret')!,
  };
}

export async function ensureRelay(relayUrl: string) {
  return await globalRelayPool.ensureRelay(relayUrl);
}
