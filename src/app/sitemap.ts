import type { MetadataRoute } from "next";
import { SITE, COMMUNITY_CATEGORIES } from "@/lib/constants";
import { createPublicClient } from "@/lib/supabase/public";
import { hasSupabaseEnv } from "@/lib/supabase/env";

// 공개 데이터라 1시간 캐시 — 로봇이 올 때마다 DB 를 훑지 않게
export const revalidate = 3600;

const STATIC_PATHS = [
  "",
  "/tiers",
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

/** 개별 게시글/대회/리포트 URL — 이게 빠져 있으면 검색로봇이 목록 페이지 너머로는 못 들어간다. */
async function dynamicEntries(base: string): Promise<MetadataRoute.Sitemap> {
  if (!hasSupabaseEnv) return [];
  try {
    const supabase = createPublicClient();
    const [{ data: posts }, { data: tournaments }, { data: reports }] = await Promise.all([
      supabase.from("posts").select("id, updated_at").order("created_at", { ascending: false }).limit(5000), // 기본 1000행 제한 회피
      supabase.from("tournaments").select("slug, starts_at"),
      supabase.from("reports").select("slug, updated_at").eq("status", "published"),
    ]);

    return [
      ...(posts ?? []).map((p) => ({
        url: `${base}/community/post/${p.id}`,
        lastModified: new Date(p.updated_at),
        changeFrequency: "weekly" as const,
      })),
      ...(tournaments ?? []).map((t) => ({
        url: `${base}/tournaments/${t.slug}`,
        lastModified: new Date(t.starts_at),
        changeFrequency: "weekly" as const,
      })),
      ...(reports ?? []).map((r) => ({
        url: `${base}/reports/${r.slug}`,
        lastModified: new Date(r.updated_at),
        changeFrequency: "monthly" as const,
      })),
    ];
  } catch (e) {
    console.error("[sitemap]", e);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
    ...(await dynamicEntries(base)),
  ];
}
