import { LnParams } from "@mempool/shared";

function transformAddressToUrl(lightningAddress: string): string {
  const [username, domain] = lightningAddress.split('@');

  return `https://${domain}/.well-known/lnurlp/${username}`;
}

export async function getLNParams(lightningAddress: string): Promise<LnParams> {
  const url = transformAddressToUrl(lightningAddress);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch LN params');
  }
  
  const data = await response.json() as LnParams; 

  if (!data.callback || !data.maxSendable || !data.minSendable || !data.metadata || !data.tag) {
    throw new Error('Invalid LN params');
  }


  return data;
}
