/**
 * 메타 덱 동기화 — Piltover Archive 공개 API(/api/external/v1) 에서
 * OGN/OGS(한국 스탠다드) 카드풀만 쓰는 덱을 가져와 meta_decks 테이블에 채운다.
 *
 *   npx tsx scripts/sync-meta-decks.ts [--pages=20] [--max=60] [--all]
 *     --all  : 대회 덱이 아니어도 포함 (기본은 대회 결과 우선 + 인기 덱 일부)
 *
 * env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * 사전: supabase/meta-decks.sql 실행
 *
 * 데이터 출처: Piltover Archive (https://piltoverarchive.com) — 사이트에 출처 표기.
 */
import { readFileSync } from "node:fs";
import { loadEnv, supabaseAdmin } from "./_shared";

loadEnv();

const API = "https://piltoverarchive.com/api/external/v1";
const KR_SETS = new Set(["OGN", "OGS"]);
const SET_LETTER: Record<string, string> = { OGN: "A", OGS: "B" };

const argv = process.argv.slice(2);
const PAGES = Number(argv.find((a) => a.startsWith("--pages="))?.split("=")[1] ?? 25);
const MAX = Number(argv.find((a) => a.startsWith("--max="))?.split("=")[1] ?? 60);
const INCLUDE_ALL = argv.includes("--all");

const TOURNEY_RE =
  /\b(1st|2nd|3rd|first place|top\s?\d|winner|won|champion|championship|regional|qualifier|\bRQ\b|nationals?|national open|city challenge|skirmish|worlds?|invitational|undefeated|best of|placed?)\b/i;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getJson(url: string) {
  const r = await fetch(url, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

/** "OGN-039a" / "OGN-299*" → { prefix:"OGN", num:39 } */
function parseVariant(vn: string | null | undefined): { prefix: string; num: number } | null {
  const m = String(vn ?? "").match(/^([A-Z]{2,4})-0*(\d+)/);
  if (!m) return null;
  return { prefix: m[1], num: Number(m[2]) };
}

const champBase = (name: string) =>
  name.split(/[,–-]/)[0].trim().toLowerCase();

type OurCard = { setId: string; num: number };

/** data/cards.json → "OGN:39" 형태의 보유 카드 집합. 덱이 우리 풀에 다 있는지 검증용. */
function loadOurPool(): Set<string> {
  const raw = JSON.parse(readFileSync(new URL("../data/cards.json", import.meta.url), "utf8"));
  const arr: any[] = Array.isArray(raw) ? raw : raw.cards ?? raw.items ?? [];
  const s = new Set<string>();
  for (const c of arr) {
    const setId = c.set?.set_id;
    const num = Number(c.collector_number);
    if (setId && Number.isFinite(num)) s.add(`${setId}:${num}`);
  }
  return s;
}

function refOf(v: { prefix: string; num: number }): string | null {
  const letter = SET_LETTER[v.prefix];
  return letter ? `${letter}${v.num}` : null;
}

type PaCard = { v: { prefix: string; num: number }; name: string };

async function buildPaCardMaps() {
  // card.id → 대표(Standard/최소번호) 변형,  variant.id → card.id
  const byCard = new Map<string, PaCard>();
  const stdRank = new Map<string, number>(); // card.id → 현재 채택된 변형의 우선순위(낮을수록 우선)
  const variantToCard = new Map<string, string>();

  for (let page = 1; page <= 40; page++) {
    const j = await getJson(`${API}/cards?limit=100&page=${page}`);
    for (const variant of (j.data ?? []) as any[]) {
      const cardId = variant.card?.id;
      const v = parseVariant(variant.variantNumber);
      if (!cardId || !v || !KR_SETS.has(v.prefix)) continue;
      if (variant.id) variantToCard.set(variant.id, cardId);
      // Standard 변형 우선, 그다음 낮은 수집번호
      const rank = (variant.variantType === "Standard" ? 0 : 100000) + v.num;
      if (!stdRank.has(cardId) || rank < stdRank.get(cardId)!) {
        stdRank.set(cardId, rank);
        byCard.set(cardId, { v, name: variant.card?.name ?? "" });
      }
    }
    if (!j.pagination?.hasNext) break;
    await sleep(200);
  }
  return { byCard, variantToCard };
}

async function main() {
  const db = supabaseAdmin();
  const ourPool = loadOurPool();
  console.log(`우리 카드풀: ${ourPool.size}개 (OGN/OGS)`);

  console.log("Piltover Archive 카드 맵 구축 중…");
  const { byCard, variantToCard } = await buildPaCardMaps();
  console.log(`  PA OGN/OGS 카드: ${byCard.size}개`);

  // 1) 덱 목록에서 sets ⊆ {OGN,OGS} 후보 수집
  type Cand = { id: string; name: string; likes: number; views: number; created: string; tourney: boolean };
  const cands: Cand[] = [];
  for (let page = 1; page <= PAGES; page++) {
    const j = await getJson(`${API}/decks?limit=100&sort=likes&page=${page}`);
    const rows: any[] = j.data ?? [];
    if (!rows.length) break;
    for (const d of rows) {
      const sets: string[] = (d.sets ?? []).map((s: any) => s.prefix);
      if (!sets.length || !sets.every((s) => KR_SETS.has(s))) continue;
      cands.push({
        id: d.id,
        name: d.name ?? "이름 없음",
        likes: d.likes ?? 0,
        views: d.views ?? 0,
        created: d.createdAt ?? d.editedAt ?? null,
        tourney: TOURNEY_RE.test(d.name ?? ""),
      });
    }
    await sleep(250);
  }
  console.log(`OGN/OGS 전용 후보 덱: ${cands.length}개 (대회 ${cands.filter((c) => c.tourney).length})`);

  // 대회 덱 우선, 그다음 인기순
  cands.sort((a, b) => Number(b.tourney) - Number(a.tourney) || b.likes - a.likes);
  const pick = (INCLUDE_ALL ? cands : cands.filter((c) => c.tourney).concat(cands.filter((c) => !c.tourney))).slice(
    0,
    MAX * 2,
  );

  let stored = 0;
  const skipped: string[] = [];

  for (const cand of pick) {
    if (stored >= MAX) break;
    await sleep(320);
    let detail: any;
    try {
      detail = await getJson(`${API}/decks/${cand.id}`);
    } catch (e) {
      skipped.push(`${cand.name} — 상세 조회 실패`);
      continue;
    }

    // 카드(cardId 또는 variantId) → 우리 풀의 대표 변형
    const resolve = (id: string | undefined) => {
      if (!id) return null;
      const cardId = byCard.has(id) ? id : variantToCard.get(id);
      const hit = cardId ? byCard.get(cardId) : undefined;
      if (!hit) return null;
      if (!ourPool.has(`${hit.v.prefix}:${hit.v.num}`)) return null;
      return hit;
    };

    // 레전드: deck.legend.id(변형 id) → card → 대표 변형
    const legendHit = resolve(detail.legend?.id) ?? resolve(detail.legend?.cardId);
    if (!legendHit) {
      skipped.push(`${cand.name} — 레전드 해석 불가 (${detail.legend?.variantNumber})`);
      continue;
    }
    const legendV = legendHit.v;

    const zones: Array<{ list: any[]; def: number }> = [
      { list: detail.champions ?? [], def: 1 },
      { list: detail.battlefields ?? [], def: 1 },
      { list: detail.runes ?? [], def: 1 },
      { list: detail.maindeck ?? [], def: 1 },
    ];

    // 지정 챔피언 = 레전드와 같은 이름의 첫 챔피언
    const legendBase = champBase(detail.legend?.name ?? "");
    let championRef: string | null = null;
    let bad = false;
    const entryCount = new Map<string, number>();
    let total = 1; // 레전드

    for (const [zi, zone] of zones.entries()) {
      for (const item of zone.list) {
        const hit = resolve(item.cardId);
        if (!hit) {
          bad = true;
          break;
        }
        const ref = refOf(hit.v)!;
        const qty = Math.max(1, Number(item.quantity ?? zone.def));
        total += qty;
        // 챔피언 존(zi===0): 레전드와 같은 이름의 카드 1장은 지정 슬롯으로
        let toEntries = qty;
        if (zi === 0 && !championRef && champBase(hit.name) === legendBase) {
          championRef = ref;
          toEntries = qty - 1;
        }
        if (toEntries > 0) entryCount.set(ref, (entryCount.get(ref) ?? 0) + toEntries);
      }
      if (bad) break;
    }
    if (bad) {
      skipped.push(`${cand.name} — 카드 일부가 OGN/OGS 풀에 없음`);
      continue;
    }

    const legendRef = refOf(legendV)!;
    const parts = [...entryCount.entries()].map(([ref, q]) => `${ref}q${Math.min(q, 12)}`);
    const deckCode = `rr1.${legendRef}.${championRef ?? "_"}.${parts.join("-")}`;

    const domains: string[] = (detail.legend?.colors ?? [])
      .map((c: any) => String(c.name ?? "").toLowerCase())
      .filter(Boolean);

    const { error } = await db.from("meta_decks").upsert(
      {
        source: "piltoverarchive",
        source_id: cand.id,
        source_url: `https://piltoverarchive.com/decks/${cand.id}`,
        name: cand.name.slice(0, 200),
        author_name: detail.authorName ?? null,
        legend_name: detail.legend?.name ?? null,
        legend_ref: legendRef,
        domains,
        deck_code: deckCode,
        card_count: total,
        likes: cand.likes,
        views: cand.views,
        is_tournament: cand.tourney,
        published_at: cand.created,
        synced_at: new Date().toISOString(),
      },
      { onConflict: "source,source_id" },
    );
    if (error) {
      skipped.push(`${cand.name} — DB: ${error.message}`);
      continue;
    }
    stored++;
    console.log(`  + ${cand.tourney ? "🏆" : "  "} ${cand.name.slice(0, 60)}  (${total}장)`);
  }

  console.log(`\n저장: ${stored}개 / 건너뜀: ${skipped.length}개`);
  if (skipped.length) console.log(skipped.map((s) => `  - ${s}`).join("\n"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
