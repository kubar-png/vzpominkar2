import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = SITE_URL;
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/jak-to-funguje",
          "/cenik",
          "/faq",
          "/darek",
          "/babybook",
          "/o-nas",
          "/kontakt",
          "/podminky",
          "/soukromi",
          "/cookies",
          "/login",
          "/signup",
          "/senior-login",
        ],
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
