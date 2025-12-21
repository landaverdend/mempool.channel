import 'websocket-polyfill';
import { NWCClient } from '@getalby/sdk';

/**
 * Creates and validates an NWC client from a connection URI.
 * The client should be stored with the room and closed when the room ends.
 */
export async function createNWCClient(nwcUri: string): Promise<NWCClient> {
  const client = new NWCClient({
    nostrWalletConnectUrl: nwcUri,
  });

  // Validate the connection by fetching wallet info
  const info = await client.getInfo();
  console.log('NWC connected - wallet alias:', info.alias || 'unknown');

  return client;
}
