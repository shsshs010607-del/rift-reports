// Rebuilds public/origins-cards.json (OGN-only slim dataset for public/origins-sim.html)
// from data/cards.json (playriftbound.com 공식 갤러리 스냅샷: { en, ko, setMax }).
// Run after `npm run sync:cards`.
//
// 카드 이름·이미지는 공식 한글판(ko-kr)을 쓴다 — 이름은 사이트 카드 DB(cardService)와 같은 규칙:
//  · 레전드는 "챔피언 - 칭호" (챔피언 본명은 tags[0], 한글 챔피언명은 챔피언 유닛 카드에서 조회)
//  · 야스오·징크스 6종은 기존 리프트나루 번역(data/cards-ko.json) 유지
//  · 변형 접미사: (얼터네이트 아트) / (오버넘버드) / (시그니처)
//
// 한국판 한정 "아리, 구미호(한복)": 오버넘버드·시그니처 아리(303, 303*)를 대체해 표시하고,
// 이미지는 public/cards/ 의 한복 아리 스캔을 쓴다.
//
// 카드별 실제 KRW 시세(리바지지 시세, card_prints/price_snapshots 를 수집번호로 매칭)도 붙인다.
// Needs .env.local (or CI secrets): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "data", "cards.json");
const KO_OVERRIDE = path.join(ROOT, "data", "cards-ko.json");
const OUT = path.join(ROOT, "public", "origins-cards.json");
const FALLBACK_USD_KRW = 1385;

const PRESERVE_RIFTNARU_KO = new Set([
  "yasuo - remorseful",
  "yasuo - windrider",
  "yasuo - unforgiven",
  "jinx - demolitionist",
  "jinx - rebel",
  "jinx - loose cannon",
]);
const HANBOK_IMG = {
  overnumbered: "/cards/hanbok-ahri-overnumbered.png",
  signature: "/cards/hanbok-ahri-signature.png",
};
const HANGUL = /[가-힣]/;
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

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

// card_prints.number 는 "303*/298" 형태(총 장수 접미사) — "/" 뒤를 떼면 sim id 의 번호와 그대로 일치.
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

const has = (list, id) => (list || []).some((t) => t.id === id);
const isLegend = (c) => has(c.cardType && c.cardType.type, "legend");

async function main() {
  loadEnv();

  const data = JSON.parse(fs.readFileSync(SRC, "utf8"));
  const koById = new Map(data.ko.map((c) => [c.id, c]));
  const riftnaru = new Map(
    Object.entries((JSON.parse(fs.readFileSync(KO_OVERRIDE, "utf8")).map) || {}),
  );

  // 영문 챔피언명 → 한글 챔피언명 (챔피언 유닛 카드의 name)
  const championKo = new Map();
  for (const c of data.en) {
    if (!has(c.cardType && c.cardType.type, "unit") || !has(c.cardType && c.cardType.superType, "champion")) continue;
    const k = koById.get(c.id);
    const n = k && k.name && k.name.trim();
    if (n && HANGUL.test(n) && !championKo.has(c.name.trim())) championKo.set(c.name.trim(), n);
  }

  const [priceByNumber, usdKrw] = await Promise.all([fetchOgnPriceByNumber(), fetchUsdKrw()]);

  const ogn = data.en.filter((c) => c.set && c.set.value && c.set.value.id === "OGN");
  let priced = 0;
  const cards = ogn.map((c) => {
    const ko = koById.get(c.id) || c;
    const tag = c.tags && c.tags.tags && c.tags.tags[0];
    const legend = isLegend(c);

    // 영문 전체 이름(번역 키) / 한글 전체 이름
    const enFull = legend && tag ? `${tag} - ${c.name.trim()}` : c.subtitle ? `${c.name.trim()} - ${c.subtitle}` : c.name.trim();
    let koName = ko.name.trim();
    if (legend && tag && championKo.get(tag)) koName = `${championKo.get(tag)} - ${koName}`;
    else if (ko.subtitle) koName = `${koName} - ${ko.subtitle}`;
    const key = enFull.toLowerCase();
    if (PRESERVE_RIFTNARU_KO.has(key) && riftnaru.has(key)) koName = riftnaru.get(key).n;

    // sim 의 id 규칙: 시그니처 변형은 번호에 '*' (예: ogn-303*-298) — showcaseBucket 이 이걸로 구분한다.
    const id = c.id.replace("-star", "*");
    const num = id.split("-")[1].toLowerCase();
    const rarity = cap(c.rarity.value.id);

    let bucket = null;
    if (rarity === "Showcase") {
      bucket = num.includes("*") ? "signature" : parseInt(num, 10) >= 299 ? "overnumbered" : "altart";
    }
    const isHanbok = bucket !== null && bucket !== "altart" && /^Nine-Tailed Fox$/i.test(c.name.trim()) && tag === "Ahri";
    if (isHanbok) koName = "아리 - 구미호 (한복)";
    if (bucket) koName += ` (${{ signature: "시그니처", overnumbered: "오버넘버드", altart: "얼터네이트 아트" }[bucket]})`;

    const usd = priceByNumber.get(num);
    const price = typeof usd === "number" ? Math.max(1, Math.round(usd * usdKrw)) : undefined;
    if (price != null) priced++;

    return {
      id,
      name: koName,
      rarity,
      type: cap(c.cardType.type[0].id),
      domain: ((c.domain && c.domain.values) || []).map((d) => cap(d.id)),
      img: isHanbok ? HANBOK_IMG[bucket] : (ko.cardImage && ko.cardImage.url) || c.cardImage.url,
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
