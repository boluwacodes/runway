interface LogoMarkProps {
  size?: number;
  className?: string;
}

/**
 * Three ascending bars with a takeoff line through them — cash flow
 * climbing instead of sitting flat for 60 days. Deliberately not a coin,
 * a bank building, or a handshake: this is about the money moving sooner,
 * not the institution behind it.
 */
export function LogoMark({ size = 32, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Runway"
    >
      <rect x="5" y="20" width="5" height="8" fill="#047857" />
      <rect x="13.5" y="14" width="5" height="14" fill="#047857" />
      <rect x="22" y="6" width="5" height="22" fill="#047857" />
      <path
        d="M4 17L14 9L20 12L28 4"
        stroke="#1a2421"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 4H28V10"
        stroke="#1a2421"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
