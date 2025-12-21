import { SimplePool } from 'nostr-tools';

export const relayMapping = new Map<string, SimplePool>();

export function parseNWC(uri: string) {
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
