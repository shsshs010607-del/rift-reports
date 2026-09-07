import type { MetadataRoute } from "next";
import { SITE, COMMUNITY_CATEGORIES } from "@/lib/constants";

const STATIC_PATHS = [
  "",
  "/cards",
  "/deck-simulator",
  "/rules",
  "/glossary",
  "/community",
  "/trading",
  "/shops",
  "/tournaments",
  "/reports",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url.replace(/\/$/, "");
  const now = new Date();

  return [
    ...STATIC_PATHS.map((p) => ({
      url: `${base}${p}`,
      lastModified: now,
      changeFrequency: (p === "" || p === "/trading" ? "daily" : "weekly") as "daily" | "weekly",
    })),
    ...COMMUNITY_CATEGORIES.map((c) => ({
      url: `${base}/community/${c.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
    })),
  ];
}
