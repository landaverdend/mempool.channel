import 'websocket-polyfill';
import { NWCClient, Nip47GetInfoResponse } from '@getalby/sdk';
import { NWCInfo } from './types.js';

// Store active NWC clients
const nwcClients = new Map<string, NWCClient>();

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

export async function getWalletInfo(nwcUri: string): Promise<Nip47GetInfoResponse> {
  console.log('Creating NWC client...');

  const client = new NWCClient({
    nostrWalletConnectUrl: nwcUri,
  });

  try {
    console.log('Calling getInfo...');
    const info = await client.getInfo();
    console.log('Got wallet info:', info);
    return info;
  } finally {
    client.close();
  }
}

export async function createNWCClient(nwcUri: string): Promise<NWCClient> {
  const client = new NWCClient({
    nostrWalletConnectUrl: nwcUri,
  });

  // Test the connection
  await client.getInfo();

  return client;
}
