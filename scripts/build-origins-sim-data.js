// Rebuilds public/origins-cards.json (OGN-only slim dataset for public/origins-sim.html)
// from data/cards.json. Run after `npm run sync:cards` picks up new/updated OGN cards.
//
// Renames the existing overnumbered/signature "Ahri - Nine-Tailed Fox" entries to the
// Korean-exclusive "아리 - 구미호 (한복)" homage card per user direction — this replaces
// them outright in the simulator rather than adding a third variant. The image still
// points at the original (non-Hanbok) art until a real Hanbok Ahri asset is supplied.
//
// Also attaches a real KRW price per card (리바지지 시세 데이터, card_prints/price_snapshots
// matched by collector number) so the simulator can show a per-pull price + running total.
// Needs .env.local (or CI secrets): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "data", "cards.json");
const OUT = path.join(ROOT, "public", "origins-cards.json");
const FALLBACK_USD_KRW = 1385;

function loadEnv() {
  const file = path.join(ROOT, ".env.local");
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

async function fetchUsdKrw() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!res.ok) throw new Error(String(res.status));
    const j = await res.json();
    const rate = j.rates && j.rates.KRW;
    if (typeof rate === "number" && rate > 500 && rate < 3000) return Math.round(rate);
    throw new Error("환율 값 이상");
  } catch (e) {
    console.warn("  · 환율 조회 실패 — 기본값 사용", e.message);
    return FALLBACK_USD_KRW;
  }
}

// card_prints.number 는 "303 star /298" 형태(총 장수 접미사) — "/" 뒤를 떼면 origins-cards id 의 번호와 그대로 일치.
async function fetchOgnPriceByNumber() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn("  · Supabase 환경변수 없음 — 시세 없이 카드 데이터만 생성합니다.");
    return new Map();
  }
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await db
    .from("price_snapshots")
    .select("market_price, print:card_prints!inner(number, set_code)")
    .eq("is_current", true)
    .eq("is_headline", true)
    .not("market_price", "is", null);
  if (error) {
    console.warn("  · 시세 조회 실패 — 시세 없이 카드 데이터만 생성합니다.", error.message);
    return new Map();
  }
  const byNumber = new Map();
  for (const r of data) {
    if (!r.print || r.print.set_code !== "OGN") continue;
    const num = String(r.print.number || "").split("/")[0].trim().toLowerCase();
    if (num) byNumber.set(num, r.market_price);
  }
  return byNumber;
}

async function main() {
  loadEnv();

  const data = JSON.parse(fs.readFileSync(SRC, "utf8"));
  const ognCards = data.items.filter((c) => c.set && c.set.set_id === "OGN");

  const HANBOK_TARGET = /Ahri.*Nine-Tailed Fox \((Overnumbered|Signature)\)/;

  const [priceByNumber, usdKrw] = await Promise.all([fetchOgnPriceByNumber(), fetchUsdKrw()]);

  let priced = 0;
  const cards = ognCards.map((c) => {
    const isHanbok = HANBOK_TARGET.test(c.name);
    const num = String(c.riftbound_id.split("-")[1] || "").toLowerCase();
    const usd = priceByNumber.get(num);
    const price = typeof usd === "number" ? Math.max(1, Math.round((usd * usdKrw) / 100) * 100) : undefined;
    if (price != null) priced++;
    return {
      id: c.riftbound_id,
      name: isHanbok ? c.name.replace("Ahri - Nine-Tailed Fox", "아리 - 구미호 (한복)") : c.name,
      rarity: c.classification.rarity,
      type: c.classification.type,
      domain: c.classification.domain || [],
      img: c.media.image_url,
      orientation: c.orientation,
      hanbok: isHanbok,
      ...(price != null ? { price } : {}),
    };
  });

  const out = { updatedAt: new Date().toISOString().slice(0, 10), usdKrw, cards };
  fs.writeFileSync(OUT, JSON.stringify(out));
  console.log(
    `Wrote ${cards.length} OGN cards (시세 ${priced}/${cards.length}, 1 USD ≈ ₩${usdKrw}) to ${OUT} (${fs.statSync(OUT).size} bytes)`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
