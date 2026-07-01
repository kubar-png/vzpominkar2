import type { MetadataRoute } from "next";

// Test round — keep the entire site out of search indexes.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
