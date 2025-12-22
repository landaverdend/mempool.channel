import { cn } from '@/lib/utils';

type SatsIconProps = {
  className?: string;
};

export default function SatsIcon({ className }: SatsIconProps) {
  return (
    <svg
      className={cn('-skew-x-10', className)}
      width="24px"
      height="24px"
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
