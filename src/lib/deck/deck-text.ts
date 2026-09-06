import type { ResolvedDeck } from "@/lib/types/deck";

/**
 * 덱 ↔ 사람이 읽는 텍스트 디코드/인코드 (커뮤니티에 붙여넣기 / 다른 툴과 공유용).
 *
 * 레전드: 이름
 * 챔피언: 이름
 * 전장:
 * 1 이름
 * 룬:
 * 6 이름
 * 메인덱:
 * 3 이름
 */

const HEAD = {
  legend: ["레전드", "legend"],
  champion: ["챔피언", "champion"],
  battlefield: ["전장", "battlefield", "battlefields"],
  rune: ["룬", "rune", "runes"],
  main: ["메인덱", "메인 덱", "deck", "main deck", "maindeck"],
};

export type TextSection = "battlefield" | "rune" | "main";

export interface ParsedDecklist {
  name: string | null;
  legendName: string | null;
  championName: string | null;
  lines: { section: TextSection; qty: number; name: string }[];
}

export function formatDecklist(rd: ResolvedDeck): string {
  const lines: string[] = [];
  if (rd.name) lines.push(`# ${rd.name}`, "");
  if (rd.legend) lines.push(`레전드: ${rd.legend.name}`);
  if (rd.champion) lines.push(`챔피언: ${rd.champion.name}`);
  for (const [key, label] of [
    ["battlefield", "전장"],
    ["rune", "룬"],
    ["main", "메인덱"],
  ] as const) {
    const sec = rd.sections[key];
    if (sec.length === 0) continue;
    lines.push("", `${label}:`);
    for (const e of sec) lines.push(`${e.qty} ${e.card.name}`);
  }
  return lines.join("\n");
}

function matchHead(line: string): keyof typeof HEAD | null {
  const low = line.toLowerCase().replace(/[:：].*$/, "").trim();
  for (const [key, aliases] of Object.entries(HEAD))
    if (aliases.includes(low)) return key as keyof typeof HEAD;
  return null;
}

export function parseDecklist(text: string): ParsedDecklist {
  const out: ParsedDecklist = { name: null, legendName: null, championName: null, lines: [] };
  let section: TextSection = "main";

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#")) {
      if (!out.name) out.name = line.replace(/^#+\s*/, "").slice(0, 60) || null;
      continue;
    }

    // "레전드: 이름" / "챔피언: 이름"
    const inline = line.match(/^(레전드|챔피언|legend|champion)\s*[:：]\s*(.+)$/i);
    if (inline) {
      const name = inline[2].trim();
      if (/레전드|legend/i.test(inline[1])) out.legendName = name;
      else out.championName = name;
      continue;
    }

    const head = matchHead(line);
    if (head) {
      if (head === "legend" || head === "champion") {
        section = "main"; // 헤더만 있고 값이 다음 줄 — 드묾, 메인 취급
      } else {
        section = head;
      }
      continue;
    }

    // "3 카드 이름" / "3x 카드 이름" / "3 x 카드 이름"
    const m = line.match(/^(\d{1,2})\s*x?\s+(.+)$/i);
    if (m) {
      out.lines.push({
        section,
        qty: Math.max(1, Math.min(9, Number(m[1]))),
        name: m[2].trim(),
      });
    } else {
      out.lines.push({ section, qty: 1, name: line });
    }
  }
  return out;
}
