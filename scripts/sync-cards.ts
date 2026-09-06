/**
 * Riftcodex → 로컬 카드 스냅샷(data/cards.json) 갱신.
 *
 *   npm run sync:cards
 *
 * 이 파일은 OpenSourceCardService 의 "원격 실패 시 폴백" 데이터다.
 * 평상시 앱은 https://api.riftcodex.com/cards 를 직접 호출(ISR 24h)하므로,
 * 스냅샷은 오프라인 개발 / API 장애 대비용.
 *
 * **지원 세트(constants.CARD_SETS)만** 받는다. 새 세트 추가하면 constants 수정 후 재실행.
 * env 불필요(Riftcodex 는 인증 없음).
 */
import { writeFileSync } from "node:fs";

import { CARD_SETS } from "../src/lib/constants";

const ENDPOINT = process.env.OPENSOURCE_CARDS_ENDPOINT ?? "https://api.riftcodex.com/cards";
const OUT = new URL("../data/cards.json", import.meta.url);
const PAGE_SIZE = 100;
const SET_CODES = CARD_SETS.map((s) => s.code);

interface RiftcodexCard {
  id: string;
  name: string;
  riftbound_id?: string;
  tcgplayer_id?: string | null;
  collector_number?: number;
  attributes?: unknown;
  classification?: unknown;
  text?: { plain?: string; flavour?: string | null };
  set?: unknown;
  media?: { image_url?: string; artist?: string };
  tags?: string[];
  orientation?: string;
  metadata?: { overnumbered?: boolean; signature?: boolean };
}

/** mapRiftcodexCard 가 읽는 필드만 남겨 용량을 줄인다. */
function slim(c: RiftcodexCard) {
  return {
    id: c.id,
    name: c.name,
    riftbound_id: c.riftbound_id,
    tcgplayer_id: c.tcgplayer_id,
    collector_number: c.collector_number,
    attributes: c.attributes,
    classification: c.classification,
    text: { plain: c.text?.plain, flavour: c.text?.flavour },
    set: c.set,
    media: { image_url: c.media?.image_url, artist: c.media?.artist },
    tags: c.tags,
    orientation: c.orientation,
    metadata: { overnumbered: c.metadata?.overnumbered, signature: c.metadata?.signature },
  };
}

async function main() {
  const items: RiftcodexCard[] = [];

  for (const code of SET_CODES) {
    let page = 1;
    let pages = 1;
    do {
      const url = `${ENDPOINT}?set_id=${code.toLowerCase()}&page=${page}&size=${PAGE_SIZE}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Riftcodex ${res.status} ${res.statusText} — ${url}`);
      const body = (await res.json()) as { items: RiftcodexCard[]; pages: number; total: number };
      items.push(...body.items);
      pages = body.pages || page;
      console.log(`  ${code} page ${page}/${pages} … 누적 ${items.length}`);
      page += 1;
    } while (page <= pages && page <= 100);
  }

  if (items.length === 0) throw new Error("카드 0건 — 엔드포인트 확인");

  const payload = {
    _source: ENDPOINT,
    _generated: new Date().toISOString().slice(0, 10),
    _note: "OpenSourceCardService 원격 실패 시 폴백. `npm run sync:cards` 로 갱신.",
    count: items.length,
    items: items.map(slim),
  };
  writeFileSync(OUT, JSON.stringify(payload));
  console.log(`[sync-cards] ${items.length}건 → data/cards.json`);
}

main().catch((err) => {
  console.error("[sync-cards] 실패:", err);
  process.exit(1);
});
