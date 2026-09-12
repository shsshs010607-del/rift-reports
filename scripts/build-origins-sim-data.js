// Rebuilds public/origins-cards.json (OGN-only slim dataset for public/origins-sim.html)
// from data/cards.json. Run after `npm run sync:cards` picks up new/updated OGN cards.
//
// Renames the existing overnumbered/signature "Ahri - Nine-Tailed Fox" entries to the
// Korean-exclusive "아리 - 구미호 (한복)" homage card per user direction — this replaces
// them outright in the simulator rather than adding a third variant. The image still
// points at the original (non-Hanbok) art until a real Hanbok Ahri asset is supplied.
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "data", "cards.json");
const OUT = path.join(__dirname, "..", "public", "origins-cards.json");

const data = JSON.parse(fs.readFileSync(SRC, "utf8"));
const ognCards = data.items.filter((c) => c.set && c.set.set_id === "OGN");

const HANBOK_TARGET = /Ahri.*Nine-Tailed Fox \((Overnumbered|Signature)\)/;

const out = ognCards.map((c) => {
  const isHanbok = HANBOK_TARGET.test(c.name);
  return {
    id: c.riftbound_id,
    name: isHanbok ? c.name.replace("Ahri - Nine-Tailed Fox", "아리 - 구미호 (한복)") : c.name,
    rarity: c.classification.rarity,
    type: c.classification.type,
    domain: c.classification.domain || [],
    img: c.media.image_url,
    orientation: c.orientation,
    hanbok: isHanbok,
  };
});

fs.writeFileSync(OUT, JSON.stringify(out));
console.log(`Wrote ${out.length} OGN cards to ${OUT} (${fs.statSync(OUT).size} bytes)`);
