import { SITE, COMMUNITY_CATEGORIES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

/**
 * 커뮤니티 최신 글 RSS 2.0 피드 — 네이버 서치어드바이저 등 검색로봇이 새 글을
 * 목록 페이지 크롤링 없이 바로 수집하도록. 최신 50개, 전체 게시판 통합.
 */
export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Map<string, string> = new Map(COMMUNITY_CATEGORIES.map((c) => [c.slug, c.label]));

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function excerptOf(body: string, max = 200): string {
  const plain = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`[\]()!-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > max ? plain.slice(0, max) + "…" : plain;
}

export async function GET() {
  const base = SITE.url.replace(/\/$/, "");
  let items: { id: string; title: string; body: string; category: string; created_at: string }[] = [];

  if (hasSupabaseEnv) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("posts")
        .select("id, title, body, category, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      items = data ?? [];
    } catch (e) {
      console.error("[rss]", e);
    }
  }

  const itemsXml = items
    .map((p) => {
      const url = `${base}/community/post/${p.id}`;
      const label = CATEGORY_LABEL.get(p.category) ?? p.category;
      return `  <item>
    <title>${escapeXml(p.title)}</title>
    <link>${url}</link>
    <guid isPermaLink="true">${url}</guid>
    <pubDate>${new Date(p.created_at).toUTCString()}</pubDate>
    <category>${escapeXml(label)}</category>
    <description>${escapeXml(excerptOf(p.body))}</description>
  </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${escapeXml(SITE.name)} 커뮤니티</title>
  <link>${base}/community</link>
  <description>${escapeXml(SITE.description)}</description>
  <language>ko-kr</language>
${itemsXml}
</channel>
</rss>
`;

  return new Response(xml, {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
