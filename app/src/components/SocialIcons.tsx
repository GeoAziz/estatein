type IconProps = { size?: number; className?: string };

export function Instagram({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function Facebook({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M14.5 8.5H16.5V5.3C16.16 5.26 15 5.16 13.66 5.16C10.85 5.16 8.93 6.88 8.93 10.04V12.6H5.8V16.16H8.93V22H12.6V16.16H15.6L16.1 12.6H12.6V10.4C12.6 9.36 12.88 8.5 14.5 8.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Linkedin({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <line x1="7.5" y1="10" x2="7.5" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="7.5" cy="7" r="1" fill="currentColor" />
      <path
        d="M11.5 17V10M11.5 13C11.5 11.3 12.5 10 14 10C15.5 10 16.5 11 16.5 13V17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Twitter({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M20 5.5C19.3 5.9 18.6 6.2 17.8 6.3C18.6 5.8 19.2 5.1 19.5 4.2C18.8 4.6 18 4.9 17.2 5.1C16.5 4.4 15.6 4 14.5 4C12.5 4 10.9 5.6 10.9 7.6C10.9 7.9 10.9 8.1 11 8.4C7.9 8.2 5.1 6.7 3.3 4.4C3 5 2.8 5.6 2.8 6.3C2.8 7.6 3.4 8.7 4.4 9.4C3.8 9.4 3.2 9.2 2.7 8.9V9C2.7 10.7 3.9 12.1 5.5 12.5C5.2 12.6 4.9 12.6 4.6 12.6C4.4 12.6 4.2 12.6 4 12.5C4.4 13.9 5.7 15 7.3 15C6.1 16 4.5 16.5 2.8 16.5C2.5 16.5 2.3 16.5 2 16.5C3.6 17.5 5.5 18 7.5 18C14.5 18 18.3 12.3 18.3 7.3C18.3 7.1 18.3 7 18.3 6.8C19 6.4 19.6 5.9 20 5.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
