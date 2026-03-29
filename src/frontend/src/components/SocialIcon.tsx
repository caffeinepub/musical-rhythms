import type React from "react";
interface SocialIconProps {
  platform: string;
  size?: number;
}

function Svg({
  title,
  size,
  children,
}: {
  title: string;
  size: number;
  children: React.ReactNode;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      {children}
    </svg>
  );
}

export function SocialIcon({ platform, size = 24 }: SocialIconProps) {
  if (!platform) return null;
  const p = platform.toLowerCase().trim();

  if (p === "youtube") {
    return (
      <Svg title="YouTube" size={size}>
        <rect width="24" height="24" rx="5" fill="#FF0000" />
        <path
          d="M19.6 8.2a2.2 2.2 0 0 0-1.55-1.56C16.74 6.3 12 6.3 12 6.3s-4.74 0-6.05.34A2.2 2.2 0 0 0 4.4 8.2 23 23 0 0 0 4.07 12a23 23 0 0 0 .33 3.8 2.2 2.2 0 0 0 1.55 1.56C7.26 17.7 12 17.7 12 17.7s4.74 0 6.05-.34a2.2 2.2 0 0 0 1.55-1.56A23 23 0 0 0 19.93 12a23 23 0 0 0-.33-3.8z"
          fill="white"
        />
        <path d="M10.4 14.4V9.6L14.8 12l-4.4 2.4z" fill="#FF0000" />
      </Svg>
    );
  }

  if (p === "instagram") {
    const gradId = "ig-grad";
    return (
      <Svg title="Instagram" size={size}>
        <defs>
          <radialGradient id={gradId} cx="30%" cy="107%" r="150%">
            <stop offset="0%" stopColor="#fdf497" />
            <stop offset="5%" stopColor="#fdf497" />
            <stop offset="45%" stopColor="#fd5949" />
            <stop offset="60%" stopColor="#d6249f" />
            <stop offset="90%" stopColor="#285AEB" />
          </radialGradient>
        </defs>
        <rect width="24" height="24" rx="6" fill={`url(#${gradId})`} />
        <rect
          x="2.5"
          y="2.5"
          width="19"
          height="19"
          rx="5"
          stroke="white"
          strokeWidth="1.5"
          fill="none"
        />
        <circle
          cx="12"
          cy="12"
          r="4.5"
          stroke="white"
          strokeWidth="1.5"
          fill="none"
        />
        <circle cx="17.5" cy="6.5" r="1" fill="white" />
      </Svg>
    );
  }

  if (p === "facebook") {
    return (
      <Svg title="Facebook" size={size}>
        <rect width="24" height="24" rx="5" fill="#1877F2" />
        <path
          d="M13.5 21v-7.5H16l.5-3H13.5V8.5c0-.83.42-1.5 1.5-1.5h1.5V4.2S15.3 4 14.1 4C11.5 4 10 5.6 10 8.2V10.5H7.5v3H10V21h3.5z"
          fill="white"
        />
      </Svg>
    );
  }

  if (p === "whatsapp business" || p === "wa business") {
    return (
      <Svg title="WhatsApp Business" size={size}>
        <rect width="24" height="24" rx="5" fill="#075E54" />
        <path
          d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.4-1.1A8.5 8.5 0 1 0 12 3.5z"
          fill="#25D366"
        />
        <path
          d="M9.2 8.5c-.2-.4-.4-.5-.7-.5-.1 0-.3 0-.5.1-.4.2-1.4 1.3-1.4 2.9 0 1.7 1.3 3.3 1.5 3.5.2.3 2.5 3.9 6.1 5.3.8.3 1.4.5 1.9.6.8.2 1.5.2 2.1.1.6-.1 1.9-.8 2.1-1.5.3-.7.3-1.3.2-1.5-.1-.1-.3-.2-.6-.3l-2.2-1.1c-.3-.1-.5-.2-.7.2l-.8 1.1c-.2.2-.3.3-.6.1-.9-.4-1.8-.9-2.5-1.7-.6-.6-1.1-1.4-1.3-1.7-.1-.3 0-.4.1-.5l.5-.6c.2-.2.2-.3.3-.5.1-.2 0-.4-.1-.5L9.2 8.5z"
          fill="white"
        />
        <rect x="13" y="3" width="8" height="8" rx="2" fill="#075E54" />
        <text
          x="14.5"
          y="9.5"
          fontSize="5.5"
          fontWeight="bold"
          fill="white"
          fontFamily="Arial"
        >
          B
        </text>
      </Svg>
    );
  }

  if (p === "whatsapp") {
    return (
      <Svg title="WhatsApp" size={size}>
        <rect width="24" height="24" rx="5" fill="#25D366" />
        <path
          d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.4-1.1A8.5 8.5 0 1 0 12 3.5z"
          fill="white"
        />
        <path
          d="M9.2 8.5c-.2-.4-.4-.5-.7-.5-.1 0-.3 0-.5.1-.4.2-1.4 1.3-1.4 2.9 0 1.7 1.3 3.3 1.5 3.5.2.3 2.5 3.9 6.1 5.3.8.3 1.4.5 1.9.6.8.2 1.5.2 2.1.1.6-.1 1.9-.8 2.1-1.5.3-.7.3-1.3.2-1.5-.1-.1-.3-.2-.6-.3l-2.2-1.1c-.3-.1-.5-.2-.7.2l-.8 1.1c-.2.2-.3.3-.6.1-.9-.4-1.8-.9-2.5-1.7-.6-.6-1.1-1.4-1.3-1.7-.1-.3 0-.4.1-.5l.5-.6c.2-.2.2-.3.3-.5.1-.2 0-.4-.1-.5L9.2 8.5z"
          fill="#25D366"
        />
      </Svg>
    );
  }

  if (p === "twitter" || p === "twitter / x" || p === "x") {
    return (
      <Svg title="Twitter / X" size={size}>
        <rect width="24" height="24" rx="5" fill="#000000" />
        <path
          d="M13.4 10.9L18.7 5h-1.3L12.8 10l-4-5H4.5l5.6 7.8L4.5 19h1.3l4.9-5.4 3.9 5.4H19L13.4 10.9zm-1.7 1.9l-.6-.8-4.5-6.1h1.9l3.6 5 .6.8 4.7 6.4h-1.9l-3.8-5.3z"
          fill="white"
        />
      </Svg>
    );
  }

  if (p === "telegram") {
    return (
      <Svg title="Telegram" size={size}>
        <rect width="24" height="24" rx="12" fill="#2CA5E0" />
        <path
          d="M5.5 11.8l12-4.8c.6-.2 1 .1.8.9l-2 9.4c-.1.6-.5.8-.9.5L12 15.3l-1.6 1.6c-.2.2-.4.3-.7.3l.3-3.8 5.8-5.2c.3-.2 0-.3-.4 0l-7.1 4.5-3-1c-.7-.2-.7-.6.4-1z"
          fill="white"
        />
      </Svg>
    );
  }

  if (p === "spotify") {
    return (
      <Svg title="Spotify" size={size}>
        <rect width="24" height="24" rx="12" fill="#1DB954" />
        <path
          d="M12 5a7 7 0 1 0 0 14A7 7 0 0 0 12 5zm3.1 10.1a.44.44 0 0 1-.6.1c-1.6-1-3.7-1.2-6.1-.7a.44.44 0 0 1-.2-.85c2.6-.6 4.9-.3 6.7.8.2.1.3.4.2.65zm.8-1.9a.54.54 0 0 1-.75.15c-1.85-1.14-4.65-1.47-6.83-.8a.55.55 0 0 1-.34-1.04c2.5-.76 5.55-.4 7.68.9.25.15.33.5.24.79zm.08-1.97c-2.2-1.31-5.84-1.43-7.95-.79a.65.65 0 0 1-.4-1.25c2.42-.73 6.44-.59 8.98.91.34.2.45.65.25.99a.71.71 0 0 1-.88.14z"
          fill="white"
        />
      </Svg>
    );
  }

  if (p === "soundcloud") {
    return (
      <Svg title="SoundCloud" size={size}>
        <rect width="24" height="24" rx="5" fill="#FF5500" />
        <path
          d="M3 13.5c0 1.1.9 2 2 2h11.5a2.5 2.5 0 0 0 .2-5 4.5 4.5 0 0 0-4.3-3.2c-.5 0-1 .1-1.4.3A3.5 3.5 0 0 0 7.5 10a3.5 3.5 0 0 0-4.5 3.5z"
          fill="white"
        />
      </Svg>
    );
  }

  if (p === "tiktok") {
    return (
      <Svg title="TikTok" size={size}>
        <rect width="24" height="24" rx="5" fill="#010101" />
        <path
          d="M19 8.1a4.5 4.5 0 0 1-2.7-.9v5.7a4.8 4.8 0 1 1-4.8-4.8h.3v2.4h-.3a2.4 2.4 0 1 0 2.4 2.4V4h2.4a4.5 4.5 0 0 0 2.7 4.1z"
          fill="white"
        />
        <path
          d="M19 8.1a4.5 4.5 0 0 1-2.7-.9v5.7a4.8 4.8 0 1 1-4.8-4.8h.3v2.4h-.3a2.4 2.4 0 1 0 2.4 2.4V4h2.4a4.5 4.5 0 0 0 2.7 4.1z"
          fill="none"
          stroke="#69C9D0"
          strokeWidth="0.5"
        />
      </Svg>
    );
  }

  if (p === "linkedin") {
    return (
      <Svg title="LinkedIn" size={size}>
        <rect width="24" height="24" rx="4" fill="#0077B5" />
        <path
          d="M7 9.5h-2v8h2v-8zM6 8.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM19 13.5c0-2.5-1.3-4-3.3-4-1 0-1.7.5-2.2 1.2V9.5H11v8h2.5v-4.3c0-1.1.5-1.8 1.5-1.8s1.5.7 1.5 1.8v4.3H19v-4z"
          fill="white"
        />
      </Svg>
    );
  }

  if (p === "snapchat") {
    return (
      <Svg title="Snapchat" size={size}>
        <rect width="24" height="24" rx="5" fill="#FFFC00" />
        <path
          d="M12 4.5c-1.9 0-3.5 1.3-3.5 4.3v.5l-.8.4c-.5.2-.8.3-.8.6 0 .4.4.6.8.7.2.1.2.2.1.5l-.3.7c-.6 1.3-1.7 1.5-2.5 1.7-.1 0-.1.2-.1.4.5.1.8.4.8.7 0 .2-.2.3-.6.4a2.2 2.2 0 0 0-.7.3c0 .3.4.6 1.1.7.1 0 .2.1.3.3.5 1 1.4 1 2.5.7.7-.3 1.4-.5 2.2-.5s1.5.2 2.2.5c1.1.3 2 .3 2.5-.7.1-.2.2-.2.3-.3.7-.1 1.1-.4 1.1-.7-.2-.2-.5-.3-.7-.3-.4-.1-.6-.2-.6-.4 0-.3.3-.6.8-.7 0-.2 0-.3-.1-.4-.8-.2-1.9-.4-2.5-1.7l-.3-.7c-.1-.3-.1-.4.1-.5.4-.1.8-.3.8-.7 0-.3-.3-.4-.8-.6l-.8-.4v-.5c0-3-1.6-4.3-3.5-4.3z"
          fill="#010101"
        />
      </Svg>
    );
  }

  if (p === "podcast") {
    return (
      <Svg title="Podcast" size={size}>
        <rect width="24" height="24" rx="5" fill="#8B5CF6" />
        <rect x="9.5" y="3" width="5" height="10" rx="2.5" fill="white" />
        <path
          d="M6.5 11a5.5 5.5 0 0 0 11 0"
          stroke="white"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <line
          x1="12"
          y1="16.5"
          x2="12"
          y2="21"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="9"
          y1="21"
          x2="15"
          y2="21"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </Svg>
    );
  }

  // Website / default
  return (
    <Svg title="Website" size={size}>
      <rect width="24" height="24" rx="5" fill="#6B7280" />
      <circle
        cx="12"
        cy="12"
        r="7"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M12 5c-2 2-2.5 4.5-2.5 7S10 16 12 19c2-3 2.5-4.5 2.5-7S14 7 12 5z"
        stroke="white"
        strokeWidth="1.2"
        fill="none"
      />
      <line x1="5.5" y1="9" x2="18.5" y2="9" stroke="white" strokeWidth="1.2" />
      <line
        x1="5.5"
        y1="15"
        x2="18.5"
        y2="15"
        stroke="white"
        strokeWidth="1.2"
      />
    </Svg>
  );
}
