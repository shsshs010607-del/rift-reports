import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * 영문 카드/프린트명 → 한글 표시명.
 * data/cards-ko.json (riftnaru 번역, 소문자 영문명 → { n: 한글명 }) 를 사용한다.
 * 매칭 실패 시 원문을 그대로 돌려준다.
 */

type KoMap = Record<string, { n?: string; t?: string }>;

let KO: KoMap | null = null;
function koMap(): KoMap {
  if (KO) return KO;
  try {
    const file = path.join(process.cwd(), "data", "cards-ko.json");
    const parsed = JSON.parse(readFileSync(file, "utf8")) as { map?: KoMap };
    KO = parsed.map ?? {};
  } catch {
    KO = {};
  }
  return KO;
}

/** 프린트명 꼬리표 (Signature) 등 → 한글 라벨. */
const TREATMENT_KO: Record<string, string> = {
  signature: "시그니처",
  overnumbered: "오버넘버드",
  "alternate art": "얼터네이트 아트",
  "alt art": "얼터네이트 아트",
  showcase: "쇼케이스",
  promo: "프로모",
  foil: "포일",
  "full art": "풀 아트",
};

function splitTreatment(name: string): [string, string | null] {
  const m = name.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (m) return [m[1].trim(), m[2].trim()];
  return [name.trim(), null];
}

/** 한 개의 영문명을 한글 표시명으로. 실패 시 원문 반환. */
export function koCardName(enName: string | null | undefined): string {
  if (!enName) return "";
  const map = koMap();
  const [base, treatment] = splitTreatment(enName);
  const lower = base.toLowerCase();
  const hit =
    map[lower]?.n ??
    map[lower.replace(", ", " - ")]?.n ?? // "Ahri, Nine-Tailed Fox" → "ahri - nine-tailed fox"
    map[lower.replace(",", " -")]?.n;
  if (!hit) return enName;
  if (treatment) {
    const t = TREATMENT_KO[treatment.toLowerCase()] ?? treatment;
    return `${hit} (${t})`;
  }
  return hit;
}

/** print(.name / .name_en) 을 받아 한글명을 붙인다. */
export function withKoName<T extends { name: string; name_en?: string | null } | null>(
  print: T,
): T & { ko_name?: string } {
  if (!print) return print as T & { ko_name?: string };
  const ko = koCardName(print.name_en ?? print.name);
  return { ...print, ko_name: ko };
}
