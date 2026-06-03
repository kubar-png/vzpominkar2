import type { NextConfig } from "next";

// Single-line CSP per HTTP spec. Origin allow-list:
//   - supabase.co: storage (images, audio), realtime, auth
//   - fonts.googleapis.com / fonts.gstatic.com: web fonts
//   - api.openai.com: Whisper transcription (server-to-server, but kept in
//     connect-src in case the browser ever calls it directly)
//   - api.stripe.com: checkout / customer portal
//   - api.resend.com: transactional email
//   - media-src blob: required for in-page playback of MediaRecorder blobs
//   - microphone=(self): senior audio recorder needs mic; everything else off
const CSP = [
  "default-src 'self'",
  "img-src 'self' data: https://*.supabase.co",
  "media-src 'self' blob: https://*.supabase.co",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co https://api.openai.com https://api.stripe.com https://api.resend.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=(), payment=(self)",
  },
  // Force HTTPS at the browser for a full year (incl. subdomains). Vercel
  // terminates TLS but does not add HSTS for you.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep the Chromium engine out of the server bundle: @sparticuz/chromium ships
  // a brotli-compressed binary it resolves via __dirname at runtime, and
  // puppeteer-core must not be traced/bundled or that path breaks on Vercel.
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  typedRoutes: true,
  experimental: {
    serverActions: {
      // Default is 1MB; audio recordings (WebM/Opus from MediaRecorder)
      // can easily reach ~5MB for 5-10 minute vyprávění.
      bodySizeLimit: "25mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
  async redirects() {
    return [
      // /darek/certifikat was merged into /darek (single gifting funnel).
      // Permanent 301 keeps SEO continuity for the sub-page URL.
      { source: "/darek/certifikat", destination: "/darek", permanent: true },
      // /babybook replaced by the physical book product /kniha.
      { source: "/babybook", destination: "/kniha", permanent: true },
    ];
  },
};

export default nextConfig;
