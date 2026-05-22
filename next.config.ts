import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
};

export default nextConfig;
