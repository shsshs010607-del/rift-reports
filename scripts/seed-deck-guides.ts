/**
 * 레전드별 덱 공략 "템플릿" 글을 커뮤니티(deck-guide)에 생성한다.
 *   npx tsx scripts/seed-deck-guides.ts
 *
 * - 같은 제목의 글이 이미 있으면 건너뛴다 (idempotent).
 * - 마지막에 { tierDeck.id: postId } 매핑을 출력 → tier-list.ts 의 guidePostId 에 붙여넣기.
 * env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { readFileSync } from "node:fs";
import { loadEnv, supabaseAdmin } from "./_shared";
import { TIER_DECKS } from "../src/lib/data/tier-list";

loadEnv();

const ADMIN_EMAIL = "shsshs010607@gmail.com";

const DOMAIN_KO: Record<string, string> = {
  Fury: "분노", Calm: "침착", Mind: "지혜", Body: "육체", Chaos: "혼돈", Order: "질서",
};
const DOMAIN_TRAIT: Record<string, string> = {
  Fury: "공격적·즉발 피해", Calm: "성장·장기전", Mind: "정보·카드 이득",
  Body: "전투·거점 압박", Chaos: "변칙·고위험", Order: "물량·군단",
};

type RawLegend = { name: string; classification: { domain: string[] } };

function legendInfo() {
  const raw = JSON.parse(readFileSync(new URL("../data/cards.json", import.meta.url), "utf8"));
  const arr: RawLegend[] = Array.isArray(raw) ? raw : raw.cards ?? raw.items ?? [];
  const map = new Map<string, string[]>();
  for (const c of arr) {
    if (!/legend/i.test((c as any).classification?.type ?? "")) continue;
    if (/(Overnumbered|Signature)/.test(c.name)) continue;
    map.set(c.name, c.classification.domain ?? []);
  }
  return map;
}

/**
 * 최초 생성용 최소 본문. 실제 본문(대회 덱 ```deck 블록 포함)은
 * scripts/rebuild-deck-guides.ts 가 채운다.
 */
function body(deck: (typeof TIER_DECKS)[number], _domains: string[]) {
  return `[[${deck.keyCard}]]

${deck.subtitle}

> 공략 작성 중입니다. 대회 덱과 세부 운영은 곧 채워집니다.`;
}

async function main() {
  const db = supabaseAdmin();
  const { data: users } = await db.auth.admin.listUsers({ perPage: 100 });
  const admin = users.users.find((u) => u.email === ADMIN_EMAIL);
  if (!admin) throw new Error(`관리자(${ADMIN_EMAIL}) 계정을 찾지 못했습니다.`);

  const domainsBy = legendInfo();
  const { data: existing } = await db.from("posts").select("id,title").eq("category", "deck-guide");
  const byTitle = new Map((existing ?? []).map((p) => [p.title, p.id]));

  const map: Record<string, string> = {};

  for (const deck of TIER_DECKS) {
    const title = `${deck.name} 덱 공략`;
    if (byTitle.has(title)) {
      map[deck.id] = byTitle.get(title)!;
      console.log(`= 이미 있음: ${title}`);
      continue;
    }
    const { data, error } = await db
      .from("posts")
      .insert({
        category: "deck-guide",
        title,
        body: body(deck, domainsBy.get(deck.legendEn) ?? []),
        author_id: admin.id,
        is_pinned: true,
      })
      .select("id")
      .single();
    if (error) throw new Error(`${title}: ${error.message}`);
    map[deck.id] = data.id;
    console.log(`+ 생성: ${title} → ${data.id}`);
  }

  console.log("\n// tier-list.ts 의 각 항목에 guidePostId 로 붙여넣기:");
  console.log(JSON.stringify(map, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
