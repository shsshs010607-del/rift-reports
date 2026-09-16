// Builds public/nexus-promo-cards.json — the card pool for public/nexus-promo-sim.html.
//
// Nexus Night is Riot's weekly casual store event; attendees earn a 3-card promo pack drawn
// from a fixed pool (not a purchased booster, so no box/carton tiers or price data here).
// The pool below was compiled from public checklists (TCGplayer/riftbound.gg/riftmana listings
// for the "Origins - Nexus Night Promo Pack") and cross-checked by exact name against our own
// data/cards.json — every entry here is a real OGN card, reusing its real art. The 6 rune
// entries use the existing "(Alternate Art)" showcase print as a stand-in for the actual promo
// rune art we don't have synced; they're relabeled "(프로모)" rather than "(대체 일러스트)" so
// they don't get confused with the regular alt-art showcase pulls in the other simulators.
// One name from public checklists ("Portly Poro") isn't in our OGN data at all (likely a
// promo-exclusive card never in the retail set) and is left out rather than guessed at.
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "data", "cards.json");
const OUT = path.join(__dirname, "..", "public", "nexus-promo-cards.json");

const POOL_NAMES = [
  "Viktor - Leader",
  "Jinx - Rebel",
  "Lee Sin - Ascetic",
  "Sett - The Boss",
  "Teemo - Swift Scout",
  "Miss Fortune - Bounty Hunter",
  "Viktor - Herald of the Arcane",
  "Leona - Radiant Dawn",
  "Yasuo - Unforgiven",
  "Volibear - Relentless Storm",
  "Kai'Sa - Daughter of the Void",
  "Darius - Hand of Noxus",
  "Jinx - Loose Cannon",
  "Lee Sin - Blind Monk",
  "Ahri - Nine-Tailed Fox",
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

POOL_NAMES.forEach((name) => {
  const c = byName.get(name);
  if (!c) { missing.push(name); return; }
  cards.push({ id: c.riftbound_id, name: c.name, img: c.media.image_url, orientation: c.orientation });
});

RUNE_PROMO_SOURCE.forEach((name) => {
  const c = byName.get(name);
  if (!c) { missing.push(name); return; }
  cards.push({
    id: c.riftbound_id,
    name: c.name.replace("(Alternate Art)", "(프로모)"),
    img: c.media.image_url,
    orientation: c.orientation,
  });
});

fs.writeFileSync(OUT, JSON.stringify({ updatedAt: new Date().toISOString().slice(0, 10), cards }));
console.log(`Wrote ${cards.length} cards to ${OUT}`);
if (missing.length) console.warn("Not found in data/cards.json (skipped):", missing.join(", "));
