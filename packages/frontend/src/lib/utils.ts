import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export function isValidNwcString(nwcString: string): boolean {
  return nwcString.startsWith('nwc://');
}

