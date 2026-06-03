import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL;
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/jak-to-funguje`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/cenik`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/darek`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/kniha`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/o-nas`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/kontakt`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/podminky`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/soukromi`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/signup`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/senior-login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
