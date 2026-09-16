// Builds public/nexus-promo-cards.json — the card pool for public/nexus-promo-sim.html.
//
// Nexus Night is Riot's weekly casual store event; attendees earn a 3-card promo pack drawn
// from a fixed pool (not a purchased booster, so no box/carton tiers here).
//
// Pool composition per Riot's own "Nexus Night Prize Pack" checklist graphic (Origins season):
// 25 cards total = 1 custom-art Teemo + 6 alt-art runes + 18 parallel foils.
//
// All 25 entries below use REAL promo scans and REAL market prices, sourced from riftbound.gg
// (dotgg network) — that site indexes each Nexus Night promo print under its own collector code
// (e.g. "OGN-197b", "OGN-001-P") distinct from the base card, with its own TCGplayer price and
// its own image on the dotgg CDN (https://static.dotgg.gg/riftbound/cards/{CODE}.webp, all 25
// verified HTTP 200). Our own Riftcodex API sync doesn't carry Nexus Night promo prints at all
// (confirmed via full-database scan), so this data is hand-curated here rather than pulled from
// data/cards.json like the other simulators.
//
// Prices are TCGplayer USD snapshots read from riftbound.gg on 2026-09-16, converted to KRW at
// build time (same approach as scripts/build-origins-sim-data.js).
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "public", "nexus-promo-cards.json");
const FALLBACK_USD_KRW = 1385;

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

function img(code) {
  return `https://static.dotgg.gg/riftbound/cards/${code}.webp`;
}

// name, code(dotgg), tier, TCGplayer USD (riftbound.gg, 2026-09-16 snapshot)
const RAW = [
  ["Teemo - Scout (GG EZ)", "OGN-197b", "teemo", 1431.41],

  ["Fury Rune (Nexus Night Promo)", "OGN-007b", "rune", 3.32],
  ["Calm Rune (Nexus Night Promo)", "OGN-042b", "rune", 4.82],
  ["Mind Rune (Nexus Night Promo)", "OGN-089b", "rune", 6.43],
  ["Body Rune (Nexus Night Promo)", "OGN-126b", "rune", 3.10],
  ["Chaos Rune (Nexus Night Promo)", "OGN-166b", "rune", 6.84],
  ["Order Rune (Nexus Night Promo)", "OGN-214b", "rune", 3.42],

  ["Blazing Scorcher", "OGN-001-P", "regular", 0.33],
  ["Pouty Poro", "OGN-013-P", "regular", 1.80],
  ["Void Seeker", "OGN-024-P", "regular", 0.73],
  ["Stalwart Poro", "OGN-052-P", "regular", 1.05],
  ["Wielder of Water", "OGN-055-P", "regular", 0.25],
  ["Discipline", "OGN-058-P", "regular", 4.25],
  ["Consult the Past", "OGN-083-P", "regular", 0.49],
  ["Riptide Rex", "OGN-092-P", "regular", 0.27],
  ["Ravenbloom Student", "OGN-103-P", "regular", 2.54],
  ["Challenge", "OGN-128-P", "regular", 0.73],
  ["Pakaa Cub", "OGN-135-P", "regular", 0.27],
  ["Stormclaw Ursine", "OGN-137-P", "regular", 0.24],
  ["Mystic Poro", "OGN-171-P", "regular", 1.28],
  ["Stealthy Pursuer", "OGN-177-P", "regular", 0.22],
  ["Stacked Deck", "OGN-183-P", "regular", 9.38],
  ["Daring Poro", "OGN-210-P", "regular", 1.05],
  ["Vanguard Captain", "OGN-218-P", "regular", 0.33],
  ["Vengeance", "OGN-229-P", "regular", 0.35],
];

async function main() {
  const usdKrw = await fetchUsdKrw();
  const cards = RAW.map(([name, code, tier, usd]) => ({
    id: code.toLowerCase() + "-298",
    name,
    img: img(code),
    orientation: "portrait",
    tier,
    price: Math.max(1, Math.round(usd * usdKrw)),
  }));

  const out = { updatedAt: new Date().toISOString().slice(0, 10), usdKrw, cards };
  fs.writeFileSync(OUT, JSON.stringify(out));
  console.log(`Wrote ${cards.length} cards (1 USD ≈ ₩${usdKrw}) to ${OUT} (${fs.statSync(OUT).size} bytes)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
