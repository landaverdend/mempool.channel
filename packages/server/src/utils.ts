import { LnParams } from '@mempool/shared';

function transformAddressToUrl(lightningAddress: string): string {
  const [username, domain] = lightningAddress.split('@');

  return `https://${domain}/.well-known/lnurlp/${username}`;
}

export async function getLNParams(lightningAddress: string): Promise<LnParams> {
  const url = transformAddressToUrl(lightningAddress);

  const response = await fetch(url, { method: 'GET' });

  if (!response.ok) {
    throw new Error('Failed to fetch LN params');
  }

  const data = (await response.json()) as LnParams;

  if (!data.callback || !data.maxSendable || !data.minSendable || !data.metadata || !data.tag) {
    throw new Error('Invalid LN params');
  }

  return data;
}

type InvoiceResponse = {
  pr: string;
  routes: [];
};
export async function getInvoice(lnParams: LnParams, amount: number, comment: string): Promise<InvoiceResponse> {
  const { callback } = lnParams;

  const response = await fetch(`${callback}?amount=${amount}&comment=${comment}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Failed to generate invoice');
  }

  const data = await response.json() as InvoiceResponse;

  return data;
}
