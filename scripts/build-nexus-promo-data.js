// Builds public/nexus-promo-cards.json — the card pool for public/nexus-promo-sim.html.
//
// Nexus Night is Riot's weekly casual store event; attendees earn a 3-card promo pack drawn
// from a fixed pool (not a purchased booster, so no box/carton tiers or price data here).
//
// Pool composition per Riot's own "Nexus Night Prize Pack" checklist graphic (Origins season):
// 25 cards total = 1 custom-art Teemo + 6 alt-art runes + 18 parallel foils. An earlier version
// of this list was built from aggregated third-party web checklists that turned out to mix in
// cards from OTHER seasons' Nexus Night pools (Unleashed/Vendetta/etc. all run their own) —
// this list was corrected against the official graphic instead.
//
// The 18 "parallel foil" names below are cross-checked by exact name against data/cards.json —
// every one is a real OGN card, reusing its real (non-foil) art as a stand-in since we don't
// have the actual foil scan. Only 17 of the 18 resolved: "Portly Poro" isn't in our OGN data at
// all (promo-exclusive, never in the retail set) and is left out rather than guessed at, so the
// generated pool is 24 cards, not 25.
//
// The "1 custom-art Teemo" has no equivalent print in our data at all (it's described as bespoke
// art made for this promo) — falls back to a regular Teemo print, clearly labeled as a stand-in.
// The 6 rune entries use the existing "(Alternate Art)" showcase print as a stand-in for the
// actual promo rune art we don't have synced; relabeled "(프로모)" so they don't get confused
// with the regular alt-art showcase pulls in the other simulators.
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "data", "cards.json");
const OUT = path.join(__dirname, "..", "public", "nexus-promo-cards.json");

const POOL_NAMES = [
  "Stacked Deck",
  "Stalwart Poro",
  "Vengeance",
  "Challenge",
  "Consult the Past",
  "Vanguard Captain",
  "Pakaa Cub",
  "Blazing Scorcher",
  "Stormclaw Ursine",
  "Riptide Rex",
  "Daring Poro",
  "Stealthy Pursuer",
  "Wielder of Water",
  "Mystic Poro",
  "Discipline",
  "Void Seeker",
  "Ravenbloom Student",
];

// 커스텀 아트 테모 — 실제 프로모 아트 데이터 없음, 기존 테모 카드로 대체 표시.
const TEEMO_STANDIN = "Teemo - Swift Scout";

const RUNE_PROMO_SOURCE = [
  "Mind Rune (Alternate Art)",
  "Fury Rune (Alternate Art)",
  "Order Rune (Alternate Art)",
  "Calm Rune (Alternate Art)",
  "Body Rune (Alternate Art)",
  "Chaos Rune (Alternate Art)",
];

const data = JSON.parse(fs.readFileSync(SRC, "utf8"));
const byName = new Map(data.items.map((c) => [c.name, c]));

const cards = [];
const missing = [];

function add(name, tier, rename) {
  const c = byName.get(name);
  if (!c) { missing.push(name); return; }
  cards.push({
    id: c.riftbound_id,
    name: rename ? rename(c.name) : c.name,
    img: c.media.image_url,
    orientation: c.orientation,
    tier: tier,
  });
}

add(TEEMO_STANDIN, "teemo", (n) => n + " (커스텀 아트 대체)");
RUNE_PROMO_SOURCE.forEach((name) => add(name, "rune", (n) => n.replace("(Alternate Art)", "(프로모)")));
POOL_NAMES.forEach((name) => add(name, "regular"));

fs.writeFileSync(OUT, JSON.stringify({ updatedAt: new Date().toISOString().slice(0, 10), cards }));
console.log(`Wrote ${cards.length} cards to ${OUT}`);
if (missing.length) console.warn("Not found in data/cards.json (skipped):", missing.join(", "));
