import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidLightningAddress(address: string): boolean {
  // Lightning Address format: username@domain.tld
  // Username: alphanumeric, dots, hyphens, underscores
  // - Cannot start/end with dot, hyphen, or underscore
  // - Cannot have consecutive dots
  // Domain: valid domain with TLD
  const lightningAddressRegex =
    /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;

  if (!address || typeof address !== 'string') {
    return false;
  }

  return lightningAddressRegex.test(address.trim());
}
