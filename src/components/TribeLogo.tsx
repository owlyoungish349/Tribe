type Props = {
  className?: string;
};

/** Tribe app mark — three connected nodes on a forest-green tile. */
export function TribeLogo({ className = "h-8 w-8" }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="logo-tribe-bg" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4d754d" />
          <stop offset="1" stopColor="#2f4a2f" />
        </linearGradient>
        <linearGradient id="logo-ember-glow" x1="16" y1="6" x2="16" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f0c4a8" stopOpacity="0.55" />
          <stop offset="1" stopColor="#e8a87c" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8.5" fill="url(#logo-tribe-bg)" />
      <ellipse cx="16" cy="15" rx="10" ry="9" fill="url(#logo-ember-glow)" />
      <path
        d="M16 8.25 L23.1 20.75 L8.9 20.75 Z"
        stroke="#e8a87c"
        strokeWidth="1.35"
        strokeLinejoin="round"
        strokeOpacity="0.65"
        fill="none"
      />
      <circle cx="16" cy="15.5" r="6.75" stroke="#f4f7f4" strokeWidth="0.85" strokeOpacity="0.22" fill="none" />
      <circle cx="16" cy="8.25" r="3.15" fill="#f4f7f4" />
      <circle cx="16" cy="8.25" r="1.35" fill="#3a5c3a" fillOpacity="0.35" />
      <circle cx="8.9" cy="20.75" r="3.15" fill="#e8a87c" />
      <circle cx="8.9" cy="20.75" r="1.2" fill="#c06a3e" fillOpacity="0.45" />
      <circle cx="23.1" cy="20.75" r="3.15" fill="#e8a87c" />
      <circle cx="23.1" cy="20.75" r="1.2" fill="#c06a3e" fillOpacity="0.45" />
    </svg>
  );
}
