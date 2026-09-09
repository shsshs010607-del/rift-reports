/**
 * 덱 공략 게시글 본문을 전면 재생성한다 (가독성 개선 + 대회 덱 이미지).
 *   npx tsx scripts/rebuild-deck-guides.ts
 *
 * TIER_DECKS[].guidePostId 대상. 같은 레전드의 가장 인기있는 메타 덱(대회 우선)을
 * ```deck 블록으로 넣고, 없으면 커뮤니티 기여 안내만.
 * env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { readFileSync } from "node:fs";
import { loadEnv, supabaseAdmin } from "./_shared";
import { TIER_DECKS } from "../src/lib/data/tier-list";

loadEnv();

const DOMAIN_KO: Record<string, string> = {
  Fury: "분노", Calm: "침착", Mind: "지혜", Body: "육체", Chaos: "혼돈", Order: "질서",
};

// data/cards.json — 레전드 효과 한 줄
type RawCard = {
  name: string;
  classification?: { type?: string; domain?: string[] };
};
const raw = JSON.parse(readFileSync(new URL("../data/cards.json", import.meta.url), "utf8"));
const CARDS: RawCard[] = Array.isArray(raw) ? raw : raw.cards ?? raw.items ?? [];
const KO: Record<string, { n?: string; t?: string }> = JSON.parse(
  readFileSync(new URL("../data/cards-ko.json", import.meta.url), "utf8"),
).map;
const kkey = (n: string) => n.toLowerCase().replace(/\s*\(.*?\)\s*/g, "").trim();

const SYM: Record<string, string> = {
  ":rb_exhaust:": "탈진",
  ":rb_might:": "위력",
  ":rb_rune_rainbow:": "무지개 룬",
  ":rb_energy_1:": "(1)",
  ":rb_energy_2:": "(2)",
  ":rb_energy_3:": "(3)",
  ":rb_energy_4:": "(4)",
  ":rb_energy_5:": "(5)",
  ":rb_rune_fury:": "분노 룬",
  ":rb_rune_calm:": "침착 룬",
  ":rb_rune_mind:": "지혜 룬",
  ":rb_rune_body:": "육체 룬",
  ":rb_rune_chaos:": "혼돈 룬",
  ":rb_rune_order:": "질서 룬",
};
const clean = (t: string) =>
  t
    .replace(/:rb_[a-z0-9_]+:/g, (m) => SYM[m] ?? "")
    .replace(/\s+/g, " ")
    .trim();

function legendLine(legendEn: string): { domains: string; effect: string } {
  const base = legendEn.replace(/\s*\(Starter\)\s*$/, "").toLowerCase();
  const card = CARDS.find(
    (c) => c.classification?.type === "Legend" && kkey(c.name) === base,
  );
  const domains = (card?.classification?.domain ?? [])
    .map((d) => DOMAIN_KO[d] ?? d)
    .join(" · ");
  const effect = clean(KO[base]?.t ?? "");
  return { domains, effect: effect.length > 110 ? effect.slice(0, 108) + "…" : effect };
}

const norm = (s: string) =>
  s.toLowerCase().replace(/\(.*?\)/g, "").replace(/[,\-–]/g, " ").replace(/\s+/g, " ").trim();

async function main() {
  const db = supabaseAdmin();

  const { data: metaDecks } = await db
    .from("meta_decks")
    .select("legend_name, name, deck_code, is_tournament, likes, source_url")
    .order("is_tournament", { ascending: false })
    .order("likes", { ascending: false });
  const bestBy = new Map<string, NonNullable<typeof metaDecks>[number]>();
  for (const d of metaDecks ?? []) {
    const k = norm(d.legend_name ?? "");
    if (k && !bestBy.has(k)) bestBy.set(k, d);
  }
  const findBest = (legendEn: string) => {
    const k = norm(legendEn);
    if (bestBy.has(k)) return bestBy.get(k)!;
    const first2 = k.split(" ").slice(0, 2).join(" ");
    for (const [mk, v] of bestBy) if (mk.startsWith(first2)) return v;
    return null;
  };

  let updated = 0;
  const noMeta: string[] = [];

  for (const deck of TIER_DECKS) {
    if (!deck.guidePostId) continue;
    const { domains, effect } = legendLine(deck.legendEn);
    const best = findBest(deck.legendEn);
    if (!best) noMeta.push(deck.name);

    const metaBlock = best
      ? `## 대회 덱

**${best.name}** — 실제 대회 결과 기준입니다.

\`\`\`deck
${best.deck_code}
\`\`\`

[${deck.name} 메타 덱 더 보기 →](/decks?legend=${encodeURIComponent(deck.legendEn)}) · 데이터 출처 [Piltover Archive](${best.source_url ?? "https://piltoverarchive.com/decks"})`
      : `## 대회 덱

아직 검증된 OGN·OGS 대회 덱이 없습니다. 실전 리스트를 **댓글**이나 **글 수정**으로 공유해 주시면 운영진이 본문에 반영합니다.

[덱 시뮬레이터에서 만들기 →](/deck-simulator)`;

    const body = `[[${deck.keyCard}]]

**${domains}** · ${deck.subtitle}

> OGN 오리진스 + OGS 프루빙 그라운드 (한국 스탠다드) · 현행 밴 반영
> 정식 한글명은 라이엇 공식 발표 후 반영됩니다.

${metaBlock}

## 이 덱

- **레전드** ${deck.keyCard}${effect ? ` — ${effect}` : ""}
- **지정 챔피언** — 덱 빌더 "리더 챔피언" 탭에서 ${deck.keyCard} 선택 (레전드와 같은 이름만 가능)
- **성향** — ${deck.subtitle}

## 커뮤니티가 채우는 부분

아래를 댓글로 남겨주시면 운영진이 본문에 반영합니다.

| 항목 | 내용 |
|---|---|
| 멀리건 | 킵 / 버림 카드 |
| 운영 | 초반 · 중반 · 피니시 |
| 매치업 | vs 어그로 · vs 컨트롤 · vs 미러 |

> 본문에 \`[[카드명]]\` 을 쓰면 카드 이미지가, \`\`\`deck 코드\`\`\` 를 쓰면 덱이 자동으로 들어갑니다.

---
*리바지지 덱 공략 · 한국 스탠다드(OGN·OGS) 기준*`;

    const { error } = await db
      .from("posts")
      .update({ body, updated_at: new Date().toISOString() })
      .eq("id", deck.guidePostId);
    if (error) {
      console.error(`${deck.name}: ${error.message}`);
      continue;
    }
    updated++;
    console.log(`  + ${deck.name}${best ? ` → ${best.is_tournament ? "🏆 " : ""}${best.name.slice(0, 40)}` : " (대회 덱 없음)"}`);
  }

  console.log(`\n재생성: ${updated}개`);
  if (noMeta.length) console.log(`대회 덱 없음: ${noMeta.join(", ")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
