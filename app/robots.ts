import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://vzpominkar.cz";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/cenik", "/faq", "/login", "/signup", "/senior-login"],
        disallow: [
          "/api/",
          "/auth/",
          "/dashboard",
          "/family/",
          "/home",
          "/my-memories",
          "/new-memory/",
          "/onboarding",
          "/settings",
          "/dev/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
