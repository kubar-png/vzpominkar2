/* Inline SVG icon set — keeps the landing dependency-free (no icon library).
 * All icons share a 24×24 viewbox and inherit `currentColor`. */

type IconName =
  | "book" | "gift" | "pen" | "infinity" | "cake" | "heart" | "sun" | "qr"
  | "star" | "plus" | "check" | "chevron" | "menu" | "close" | "user"
  | "cart" | "arrow-down" | "facebook" | "instagram" | "image";

const STROKE: Partial<Record<IconName, React.ReactNode>> = {
  book: <path d="M4 5a2 2 0 0 1 2-2h11a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a2 2 0 0 0-2 2zM6 17h12" />,
  gift: <><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8M12 8v13M12 8C12 5 10 3 8 4S7 8 12 8M12 8c0-3 2-5 4-4s1 4-4 4" /></>,
  pen: <path d="M4 20h4L19 9a2 2 0 0 0-3-3L5 17zM14 7l3 3" />,
  infinity: <path d="M6.5 9C4 9 4 15 6.5 15S10 12 12 12s3.5 3 5.5 3 2.5-6 0-6S14 12 12 12 8.5 9 6.5 9Z" />,
  cake: <><path d="M4 21h16M5 21v-7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7M4 15c1.5 0 1.5 1.2 3 1.2S8.5 15 10 15s1.5 1.2 3 1.2S14.5 15 16 15s1.5 1.2 3 1.2" /><path d="M12 8V5M9 8V6M15 8V6" /></>,
  heart: <path d="M12 20s-7-4.4-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5C19 15.6 12 20 12 20Z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19" /></>,
  qr: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M21 21v-3M17 21h-3" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12 5 5L20 7" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></>,
  cart: <><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M3 4h2l2.2 11.2a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L20 8H6" /></>,
  "arrow-down": <path d="M12 5v14m-6-6 6 6 6-6" />,
};

const FILL: Partial<Record<IconName, React.ReactNode>> = {
  star: <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 18.9 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" />,
  facebook: <path d="M14 9h2.5V6H14c-2 0-3.5 1.5-3.5 3.5V11H8v3h2.5v7h3v-7H16l.5-3h-3V9.7c0-.4.3-.7.7-.7z" />,
  instagram: <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5Zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5ZM17 6.2a1 1 0 1 1-1 1 1 1 0 0 1 1-1Z" />,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.5" fill="none" /><path d="m4 18 5-5 4 4 3-3 4 4" fill="none" /></>,
};

export function Icon({ name, className, size = 24 }: { name: IconName; className?: string; size?: number }) {
  const isFill = name in FILL;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill={isFill ? "currentColor" : "none"}
      stroke={isFill ? "none" : "currentColor"}
      strokeWidth={isFill ? 0 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {isFill ? FILL[name] : STROKE[name]}
    </svg>
  );
}
