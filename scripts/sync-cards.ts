/**
 * playriftbound.com 공식 카드 갤러리 → 로컬 카드 스냅샷(data/cards.json) 갱신.
 *
 *   npm run sync:cards
 *
 * 이 파일은 OpenSourceCardService 의 "원격 실패 시 폴백" 데이터다.
 * 평상시 앱은 https://playriftbound.com/{locale}/card-gallery/ 를 직접 호출(ISR 24h)하므로,
 * 스냅샷은 오프라인 개발 / 사이트 장애 대비용.
 *
 * en-us(canonical 영문) + ko-kr(공식 한글 — OGN·OGS 만 번역됨) 두 로케일을 받아
 * id 기준으로 짝지을 수 있게 그대로 저장한다. 매핑은 cardService.mapPlayriftboundCard 가 한다.
 *
 * **지원 세트(constants.CARD_SETS)만** 받는다. 새 세트 한글화가 끝나면 constants 수정 후 재실행.
 * env 불필요(공식 사이트, 인증 없음).
 */
import { writeFileSync } from "node:fs";

import { CARD_SETS } from "../src/lib/constants";

const BASE = process.env.OPENSOURCE_CARDS_ENDPOINT ?? "https://playriftbound.com";
const OUT = new URL("../data/cards.json", import.meta.url);
const SUPPORTED_SETS = new Set<string>(CARD_SETS.map((s) => s.code));
const NEXT_DATA_RE = /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/;

interface PbRawCard {
  id: string;
  collectorNumber?: number;
  name: string;
  subtitle?: string;
  set?: { value?: { id?: string } };
  cardType?: { type?: { id: string }[]; superType?: { id: string }[] };
  publicCode?: string;
  rarity?: { value?: { id?: string } };
  domain?: { values?: { id: string }[] };
  cardImage?: { url?: string };
  orientation?: string;
  illustrator?: { values?: { label?: string }[] };
  text?: { richText?: { body?: string } };
  energy?: { value?: { id?: number } };
  might?: { value?: { id?: number } };
  tags?: { tags?: string[] };
}

/** 매핑이 읽는 필드만 남겨 용량을 줄인다. */
function slim(c: PbRawCard): PbRawCard {
  return {
    id: c.id,
    collectorNumber: c.collectorNumber,
    name: c.name,
    subtitle: c.subtitle,
    set: { value: { id: c.set?.value?.id } },
    cardType: { type: c.cardType?.type, superType: c.cardType?.superType },
    publicCode: c.publicCode,
    rarity: { value: { id: c.rarity?.value?.id } },
    domain: { values: c.domain?.values },
    cardImage: { url: c.cardImage?.url },
    orientation: c.orientation,
    illustrator: { values: c.illustrator?.values?.map((v) => ({ label: v.label })) },
    text: { richText: { body: c.text?.richText?.body } },
    energy: c.energy ? { value: { id: c.energy.value?.id } } : undefined,
    might: c.might ? { value: { id: c.might.value?.id } } : undefined,
    tags: { tags: c.tags?.tags },
  };
}

async function fetchGallery(locale: "ko-kr" | "en-us") {
  const url = `${BASE}/${locale}/card-gallery/`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`playriftbound ${res.status} ${res.statusText} — ${url}`);
  const html = await res.text();
  const match = NEXT_DATA_RE.exec(html);
  if (!match) throw new Error(`__NEXT_DATA__ 를 찾지 못함 — ${url}`);

  const data = JSON.parse(match[1]);
  const blades = data?.props?.pageProps?.page?.blades ?? [];
  const gallery = blades.find((b: { fragmentId?: string }) => b.fragmentId === "card-gallery");
  const cards: PbRawCard[] = (gallery?.cards?.items ?? []).filter((c: PbRawCard) =>
    SUPPORTED_SETS.has(String(c.set?.value?.id ?? "").toUpperCase()),
  );
  const setMax: Record<string, number> = {};
  for (const s of gallery?.sets?.items ?? []) {
    if (s?.id) setMax[String(s.id).toUpperCase()] = Number(s.collectorNumberMax) || 0;
  }
  return { cards, setMax };
}

async function main() {
  console.log("  en-us 갤러리 로딩…");
  const en = await fetchGallery("en-us");
  console.log(`  en-us … ${en.cards.length}장`);

  console.log("  ko-kr 갤러리 로딩…");
  const ko = await fetchGallery("ko-kr");
  console.log(`  ko-kr … ${ko.cards.length}장`);

  if (en.cards.length === 0) throw new Error("카드 0건 — 사이트 구조 확인");

  const payload = {
    _source: `${BASE}/{locale}/card-gallery/`,
    _generated: new Date().toISOString().slice(0, 10),
    _note: "OpenSourceCardService 원격 실패 시 폴백. `npm run sync:cards` 로 갱신.",
    en: en.cards.map(slim),
    ko: ko.cards.map(slim),
    setMax: en.setMax,
  };
  writeFileSync(OUT, JSON.stringify(payload));
  console.log(`[sync-cards] ${payload.en.length}건 → data/cards.json`);
}

main().catch((err) => {
  console.error("[sync-cards] 실패:", err);
  process.exit(1);
});
