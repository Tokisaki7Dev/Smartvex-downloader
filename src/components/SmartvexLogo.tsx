interface SmartvexLogoProps {
  size?: 'sm' | 'md';
}

export function SmartvexLogo({ size = 'md' }: SmartvexLogoProps) {
  const iconSize = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';
  const textSize = size === 'sm' ? 'text-lg' : 'text-xl';

  return (
    <span className="inline-flex items-center gap-2.5 select-none whitespace-nowrap shrink-0">
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${iconSize} shrink-0`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="smartvexLogoGrad" x1="2" y1="2" x2="34" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="32" height="32" rx="9" fill="url(#smartvexLogoGrad)" />
        <path
          d="M11 12.5L18 20.5L25 12.5"
          stroke="#FFFFFF"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12.5 24.5H23.5"
          stroke="#BAE6FD"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
      <span
        className={`${textSize} font-extrabold tracking-tight text-slate-900 dark:text-white leading-none`}
      >
        smart<span className="smartvex-gradient-text">vex</span>
      </span>
    </span>
  );
}
