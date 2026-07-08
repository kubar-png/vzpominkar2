import type { NextConfig } from "next";

// Single-line CSP per HTTP spec. Origin allow-list:
//   - supabase.co: storage (images, audio), realtime, auth
//   - fonts.googleapis.com / fonts.gstatic.com: web fonts
//   - api.openai.com: Whisper transcription (server-to-server, but kept in
//     connect-src in case the browser ever calls it directly)
//   - api.stripe.com: checkout / customer portal
//   - api.resend.com: transactional email
//   - media-src blob: required for in-page playback of MediaRecorder blobs
//   - img-src blob: required for the senior photo-upload preview thumbnails
//     (URL.createObjectURL of the picked/compressed image before upload)
//   - microphone=(self): senior audio recorder needs mic; everything else off
const CSP = [
  "default-src 'self'",
  "img-src 'self' data: blob: https://*.supabase.co",
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
  // Externalizing the package keeps Next from RELOCATING it, but Vercel's file
  // tracer still won't pull the brotli binary (bin/*.br) into the function — it's
  // resolved by runtime path, not `require`d, so nft can't see it. Without this
  // the print routes 500 with: input directory ".../@sparticuz/chromium/bin"
  // does not exist. Force-include the bin/ payload for the two routes that launch
  // Chromium. Glob is relative to the project root; the pnpm-store path is
  // version-stamped, so the wildcard survives a @sparticuz/chromium bump.
  outputFileTracingIncludes: {
    "/api/print/voucher": [
      "./node_modules/.pnpm/@sparticuz+chromium@*/node_modules/@sparticuz/chromium/bin/**",
    ],
    "/api/print/book": [
      "./node_modules/.pnpm/@sparticuz+chromium@*/node_modules/@sparticuz/chromium/bin/**",
    ],
  },
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
  async rewrites() {
    return [
      // /eshop → static book-shop mockup shipped in public/eshop/. Kept as a
      // standalone HTML page (own <html>/<head>), so it lives in public/ rather
      // than the App Router. Assets referenced as /eshop/logo-*.svg (absolute).
      { source: "/eshop", destination: "/eshop/index.html" },
    ];
  },
};

export default nextConfig;
