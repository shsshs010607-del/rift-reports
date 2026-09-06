/**
 * 리프트나루(riftnaru.com) → 한글 카드 번역 스냅샷(data/cards-ko.json) 갱신.
 *
 *   npm run sync:cards-ko
 *
 * 리프트나루는 한국어 사용자용 비공식 팬 프로젝트(Riot "Legal Jibber Jabber" 준수).
 * `/api/live/cards` 에서 카드별 { names:{ko,en}, koreanImage:{name,accessibilityText,imageUrl} } 제공.
 *
 * 결과 파일은 영문 카드명(소문자) → { n: 한글명, t: 한글 룰텍스트 } 매핑.
 * cardService 가 이 맵을 읽어 Riftcodex 카드에 localization.ko 를 채우고,
 * <LocalizedCard> 가 고화질 영문 이미지 위에 이 한글 텍스트를 얹어 렌더한다.
 * 번역이 없는 카드(ko === en)는 스킵 → 앱에서 영문 그대로 표시.
 */
import { writeFileSync } from "node:fs";

import { CARD_SETS } from "../src/lib/constants";

const BASE = "https://www.riftnaru.com/api/live/cards";
const OUT = new URL("../data/cards-ko.json", import.meta.url);
const SIZE = 120; // API 최대
const SUPPORTED = new Set<string>(CARD_SETS.map((s) => s.code)); // 지원 세트만

interface RnItem {
  names?: { ko?: string; en?: string };
  koreanImage?: { name?: string; accessibilityText?: string; imageUrl?: string };
  image?: { imageUrl?: string; setId?: string };
}

const hangul = /[가-힣]/;

/** 이형/스타터 접미사 `(Alternate Art)` `(Starter)` `(입문자)` … 제거 → 기본 카드명 키. */
const baseName = (n: string) => n.replace(/\s*\([^)]*\)\s*$/, "").trim();

/** "카드명. 룰텍스트" 에서 앞의 카드명 부분을 떼고 룰텍스트만.
 *  주의: `:` 는 심볼 코드(:rb_*:)의 시작이라 벗겨내지 않는다. */
function stripLeadName(text: string, name: string): string {
  const t = (text ?? "").trim();
  if (name && t.startsWith(name)) return t.slice(name.length).replace(/^[.·\s]+/, "").trim();
  return t;
}

async function main() {
  const map: Record<string, { n: string; t: string }> = {};
  const variantKeys = new Set<string>(); // 현재 값이 이형(접미사)에서 온 키
  let page = 1;
  let total = Infinity;
  let seen = 0;

  while (seen < total && page <= 50) {
    const res = await fetch(`${BASE}?page=${page}&size=${SIZE}`);
    if (!res.ok) throw new Error(`리프트나루 ${res.status} ${res.statusText} (page ${page})`);
    const body = (await res.json()) as { items: RnItem[]; total: number };
    total = body.total ?? body.items.length;

    for (const it of body.items) {
      const setId = (it.image?.setId ?? "").toUpperCase();
      if (setId && !SUPPORTED.has(setId)) continue; // 미지원 세트 스킵

      const enRaw = it.names?.en?.trim();
      const koRaw = it.names?.ko?.trim();
      if (!enRaw || !koRaw || koRaw === enRaw || !hangul.test(koRaw)) continue; // 번역 없음 → 스킵

      const key = baseName(enRaw).toLowerCase();
      const isVariant = enRaw !== baseName(enRaw);
      // 접미사 없는 기본 인쇄판을 우선: 이미 기본으로 채워졌으면 이형으로 덮어쓰지 않음
      if (map[key] && (isVariant || !variantKeys.has(key))) continue;

      const ko = baseName(koRaw);
      const rawText = it.koreanImage?.accessibilityText ?? "";
      const text = stripLeadName(rawText, it.koreanImage?.name ?? koRaw);

      if (isVariant) variantKeys.add(key);
      else variantKeys.delete(key);
      map[key] = {
        n: ko,
        t: hangul.test(text) ? text : "", // 텍스트가 한글이 아니면(미번역) 비움
      };
    }

    seen += body.items.length;
    console.log(`  page ${page} … 누적 ${seen}/${total} (번역 ${Object.keys(map).length})`);
    if (body.items.length === 0) break;
    page += 1;
  }

  const out = {
    _source: BASE,
    _generated: new Date().toISOString().slice(0, 10),
    _note: "영문 카드명(소문자) → 한글 번역. `npm run sync:cards-ko` 로 갱신.",
    count: Object.keys(map).length,
    map,
  };
  writeFileSync(OUT, JSON.stringify(out));
  console.log(`[sync-cards-ko] 번역 ${out.count}종 → data/cards-ko.json`);
}

main().catch((err) => {
  console.error("[sync-cards-ko] 실패:", err);
  process.exit(1);
});
