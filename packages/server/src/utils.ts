function transformAddressToUrl(lightningAddress: string): string {
  const [username, domain] = lightningAddress.split('@');

  return `https://${domain}/.well-known/lnurlp/${username}`;
}

export async function checkLightningAddressResolvable(lightningAddress: string): Promise<boolean> {
  const url = transformAddressToUrl(lightningAddress);

  const response = await fetch(url);
  
  if (!response.ok) {
    return false;
  }
  const data = await response.json(); 
  console.log(data);

  return true;
}
