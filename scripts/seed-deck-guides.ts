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

function body(deck: (typeof TIER_DECKS)[number], domains: string[]) {
  const doms = domains.map((d) => `${DOMAIN_KO[d] ?? d}(${d})`).join(" · ");
  const traits = domains.map((d) => DOMAIN_TRAIT[d] ?? d).join(", ");
  return `# ${deck.name} — ${deck.tier}티어 덱

> ⚠️ 이 글은 **공략 템플릿**입니다. 실전 덱리스트와 세부 운영은 댓글 또는 수정으로 채워주세요.
> 기준: OGN(오리진) + OGS(증명의 전장) · 현행 밴 리스트 적용

## 덱 개요
- 레전드: ${deck.keyCard} (${deck.legendEn.replace(/\s*\(Starter\)\s*$/, "")})
- 지정 챔피언: 레전드와 같은 이름의 챔피언 유닛
- 도메인: ${doms} — ${traits}
- 컨셉: ${deck.subtitle}
- 승리 조건: (작성 필요)

## 덱리스트
\`\`\`
레전드: ${deck.legendEn.replace(/\s*\(Starter\)\s*$/, "")}
챔피언: (동일 이름 챔피언)
룬:
6 (레전드 색 룬)
6 (레전드 색 룬)
전장:
1 (작성 필요)
1 (작성 필요)
1 (작성 필요)
메인덱 (39~59):
3 (핵심 유닛)
...
\`\`\`
※ 덱 시뮬레이터에서 짠 뒤 "덱 코드" 또는 텍스트로 여기에 붙여넣기.

## 멀리건 가이드
- 킵: (작성 필요)
- 버림: (작성 필요)

## 턴별 운영
- 1~3턴: (작성 필요)
- 중반: (작성 필요)
- 후반 / 피니시: (작성 필요)

## 상대별 팁
- vs 어그로: (작성 필요)
- vs 컨트롤: (작성 필요)
- vs 미러: (작성 필요)

---
*리프트 리포트 · 덱 공략 템플릿 v1*`;
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
    const title = `${deck.name} ${deck.tier}티어 덱 공략`;
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
