import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// TODO: Improve this to check if the URL is valid and a valid youtube video...
export function isValidUrl(url: string): boolean {
  return !!url.trim();
}
