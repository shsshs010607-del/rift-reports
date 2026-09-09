/**
 * 덱 공략 게시글에 "현재 대회 덱" 섹션(실제 메타 덱리스트)을 넣는다.
 *   npx tsx scripts/update-deck-guides.ts
 *
 * TIER_DECKS[].guidePostId 를 대상으로, 같은 레전드의 가장 인기있는 메타 덱
 * (대회 덱 우선)을 찾아 본문 상단에 ```deck 블록 + 링크로 삽입/갱신.
 * env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { loadEnv, supabaseAdmin } from "./_shared";
import { TIER_DECKS } from "../src/lib/data/tier-list";

loadEnv();

const norm = (s: string) =>
  s.toLowerCase().replace(/\(.*?\)/g, "").replace(/[,\-–]/g, " ").replace(/\s+/g, " ").trim();

const MARK_START = "<!-- meta-deck -->";
const MARK_END = "<!-- /meta-deck -->";

async function main() {
  const db = supabaseAdmin();

  const { data: metaDecks } = await db
    .from("meta_decks")
    .select("legend_name, name, deck_code, is_tournament, likes, source_url")
    .order("is_tournament", { ascending: false })
    .order("likes", { ascending: false });

  type MD = NonNullable<typeof metaDecks>[number];
  const bestByLegend = new Map<string, MD>();
  for (const d of metaDecks ?? []) {
    const k = norm(d.legend_name ?? "");
    if (k && !bestByLegend.has(k)) bestByLegend.set(k, d);
  }
  const findBest = (legendEn: string) => {
    const k = norm(legendEn);
    if (bestByLegend.has(k)) return bestByLegend.get(k)!;
    const first2 = k.split(" ").slice(0, 2).join(" ");
    for (const [mk, v] of bestByLegend) if (mk.startsWith(first2)) return v;
    return null;
  };

  let updated = 0;
  const missing: string[] = [];

  for (const deck of TIER_DECKS) {
    if (!deck.guidePostId) continue;
    const best = findBest(deck.legendEn);
    if (!best) {
      missing.push(deck.name);
      continue;
    }

    const { data: post } = await db
      .from("posts")
      .select("id, body")
      .eq("id", deck.guidePostId)
      .maybeSingle();
    if (!post) continue;

    const block =
      `${MARK_START}\n` +
      `## 🏆 현재 대회 덱\n\n` +
      `실제 대회 결과 기반 덱리스트입니다. ([${deck.name} 메타 덱 전체 보기](/decks?legend=${encodeURIComponent(deck.legendEn)}))\n\n` +
      `**${best.name}**\n\n` +
      "```deck\n" +
      `${best.deck_code}\n` +
      "```\n\n" +
      `> 데이터 출처: [Piltover Archive](${best.source_url ?? "https://piltoverarchive.com/decks"})\n` +
      `${MARK_END}`;

    let body: string = post.body;
    const re = new RegExp(`${MARK_START}[\\s\\S]*?${MARK_END}`);
    if (re.test(body)) {
      body = body.replace(re, block);
    } else {
      // 본문 맨 위 (첫 인용구/제목 앞) 삽입
      body = `${block}\n\n${body}`;
    }

    const { error } = await db
      .from("posts")
      .update({ body, updated_at: new Date().toISOString() })
      .eq("id", post.id);
    if (error) {
      console.error(`${deck.name}: ${error.message}`);
      continue;
    }
    updated++;
    console.log(`  + ${deck.name} → ${best.is_tournament ? "🏆 " : ""}${best.name.slice(0, 45)}`);
  }

  console.log(`\n갱신: ${updated}개`);
  if (missing.length) console.log(`메타 덱 없음: ${missing.join(", ")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
