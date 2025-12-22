import { cn } from '@/lib/utils';

type IconProps = {
  className?: string;
  width?: number;
  height?: number;
};

export function SatsIcon({ className, width = 24, height = 24 }: IconProps) {
  return (
    <svg
      className={cn('-skew-x-10', className)}
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="white"
      xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M12.75 18.5V21H11.25V18.5H12.75Z" fill="white" />
      <path fillRule="evenodd" clipRule="evenodd" d="M17 16.75H7V15.25H17V16.75Z" fill="white" />
      <path fillRule="evenodd" clipRule="evenodd" d="M17 12.7499H7V11.2499H17V12.7499Z" fill="white" />
      <path fillRule="evenodd" clipRule="evenodd" d="M17 8.75H7V7.25H17V8.75Z" fill="white" />
      <path fillRule="evenodd" clipRule="evenodd" d="M12.75 3V5.5H11.25V3H12.75Z" fill="white" />
    </svg>
  );
}

export function LightningIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

export function CopyIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}
