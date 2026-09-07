/**
 * JustTCG → Supabase 시세 동기화. (리프트바운드 전용)
 *
 *   npm run sync:prices                (로컬, .env.local)
 *   .github/workflows/sync-prices.yml  (8시간마다 자동)
 *
 * env: JUSTTCG_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * 흐름: /cards?game=riftbound... 전체 수집(≈8콜) → card_prints upsert
 *       → 기존 스냅샷 is_current=false → 새 스냅샷 insert → 90일 초과 정리
 */
import { readFileSync } from "node:fs";
import { loadEnv, requireEnv, supabaseAdmin } from "./_shared";
import { PRICE } from "../src/lib/constants";
import { fetchAllCards, toPrintRow, toSnapshotRows, type JustTcgConfig } from "../src/lib/justtcg";

loadEnv();

/**
 * data/cards.json (Riftcodex 고화질 스냅샷) → tcgplayer_id 기준 이미지 맵.
 * JustTCG 는 이미지를 안 주므로, 우리가 가진 rgpub 원본 이미지로 교체한다.
 */
function localImageByTcgId(): Map<string, string> {
  const map = new Map<string, string>();
  try {
    const raw = JSON.parse(readFileSync(new URL("../data/cards.json", import.meta.url), "utf8"));
    const arr: any[] = Array.isArray(raw) ? raw : raw.cards ?? raw.items ?? [];
    for (const c of arr) {
      const tid = c.tcgplayer_id ?? c.tcgplayerId;
      const url = c.media?.image_url ?? c.image_url ?? c.imageUrl;
      if (tid && url) map.set(String(tid), url);
    }
  } catch (e) {
    console.warn("  · data/cards.json 로드 실패 — TCGplayer 이미지로 폴백", (e as Error).message);
  }
  return map;
}

const DRY = process.argv.includes("--dry"); // JustTCG 만 확인, DB 미기록

const cfg: JustTcgConfig = {
  apiKey: requireEnv("JUSTTCG_API_KEY"),
  game: process.env.JUSTTCG_GAME ?? PRICE.justtcgGame,
  sets: process.env.JUSTTCG_SETS ? process.env.JUSTTCG_SETS.split(",") : PRICE.sets,
  pageLimit: PRICE.pageLimit,
};
const chunk = <T>(a: T[], n: number) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

async function main() {
  console.log(`[sync-prices]${DRY ? " (dry)" : ""} game=${cfg.game}`);

  const raw = await fetchAllCards(cfg, (remain) => console.log(`  … 수집 중 (남은 콜: ${remain})`));
  // 실드 상품(박스/케이스 등) 제외 — 수집번호 없음
  const cards = raw.filter((c) => c.number && c.number !== "N/A" && c.rarity && c.rarity !== "None");
  console.log(`  카드 ${cards.length}건 (실드 ${raw.length - cards.length}건 제외)`);
  if (cards.length === 0) throw new Error("카드 0건 — game id 또는 키 확인");

  if (DRY) {
    const prints = cards.map(toPrintRow);
    const snaps = cards.flatMap(toSnapshotRows);
    const headline = snaps.filter((s) => s.is_headline && s.market_price != null);
    console.log(`  프린트 ${prints.length} · 스냅샷 ${snaps.length} · 대표시세 있는 프린트 ${headline.length}`);
    console.log("  샘플:", JSON.stringify({ ...prints[0], _price: headline[0]?.market_price }, null, 2));
    const movers = [...headline].sort((a, b) => (b.change_7d ?? 0) - (a.change_7d ?? 0)).slice(0, 5);
    console.log(
      "  급등 Top5:",
      movers.map((m) => `${cards.find((c) => c.id === m.justtcg_card_id)?.name} ${m.change_7d}%`),
    );
    return;
  }

  const db = supabaseAdmin();

  // 1. card_prints upsert (이미지는 우리 고화질 스냅샷으로 교체)
  const localImg = localImageByTcgId();
  let swapped = 0;
  const printRows = cards.map((c) => {
    const row = toPrintRow(c);
    const tid = c.tcgplayerId ? String(c.tcgplayerId) : row.tcgplayer_url?.match(/product\/(\d+)/)?.[1];
    const ours = tid && localImg.get(tid);
    if (ours) {
      row.image_url = ours;
      swapped++;
    }
    return row;
  });
  console.log(`  이미지 교체 ${swapped}/${printRows.length} (나머지는 TCGplayer CDN)`);
  for (const part of chunk(printRows, 500)) {
    const { error } = await db.from("card_prints").upsert(part, { onConflict: "justtcg_card_id" });
    if (error) throw new Error(`card_prints: ${error.message}`);
  }

  // justtcg_card_id → print_id
  const { data: prints, error: pErr } = await db
    .from("card_prints")
    .select("id, justtcg_card_id")
    .not("justtcg_card_id", "is", null);
  if (pErr) throw new Error(pErr.message);
  const printId = new Map(prints!.map((r) => [r.justtcg_card_id!, r.id]));

  // 2. 스냅샷 행 구성
  const snapshots = cards.flatMap((c) => {
    const pid = printId.get(c.id);
    if (!pid) return [];
    return toSnapshotRows(c).map((s) => ({
      print_id: pid,
      is_current: true,
      is_headline: s.is_headline,
      condition: s.condition,
      printing: s.printing,
      market_price: s.market_price,
      change_24h: s.change_24h,
      change_7d: s.change_7d,
      change_30d: s.change_30d,
      change_90d: s.change_90d,
      avg_price_30d: s.avg_price_30d,
      min_price_90d: s.min_price_90d,
      max_price_90d: s.max_price_90d,
      history: s.history,
      currency: s.currency,
      tcgplayer_sku: s.tcgplayer_sku,
    }));
  });

  // 3. 이전 current 해제
  const touched = [...new Set(snapshots.map((s) => s.print_id))];
  for (const part of chunk(touched, 500)) {
    const { error } = await db
      .from("price_snapshots")
      .update({ is_current: false })
      .eq("is_current", true)
      .in("print_id", part);
    if (error) throw new Error(`is_current 해제: ${error.message}`);
  }

  // 4. 새 스냅샷
  for (const part of chunk(snapshots, 500)) {
    const { error } = await db.from("price_snapshots").insert(part);
    if (error) throw new Error(`snapshot insert: ${error.message}`);
  }
  console.log(`  스냅샷 ${snapshots.length}건`);

  // 5. 오래된 히스토리 정리
  const cutoff = new Date(Date.now() - PRICE.historyDays * 86400_000).toISOString();
  await db.from("price_snapshots").delete().lt("captured_at", cutoff).eq("is_current", false);

  console.log("[sync-prices] 완료");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
