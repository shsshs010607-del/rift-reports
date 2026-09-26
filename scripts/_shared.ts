/** 스크립트 공용: env 로딩 + service_role Supabase 클라이언트. */
import { existsSync, readFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/types/database";

/** CI 에선 process.env, 로컬에선 .env.local 파일에서 채운다. */
export function loadEnv() {
  const file = new URL("../.env.local", import.meta.url);
  if (existsSync(file)) {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

export function requireEnv(name: string): string {
  // CI 시크릿에 따옴표·공백·줄바꿈이 섞여 들어가는 흔한 실수를 흡수한다.
  let v = process.env[name]?.trim().replace(/^["']|["']$/g, "").trim();
  if (!v) {
    console.error(`환경변수 ${name} 가 없습니다 (.env.local 또는 CI secret).`);
    process.exit(1);
  }
  if (name === "NEXT_PUBLIC_SUPABASE_URL") {
    if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
    v = v.replace(/\/+$/, "");
    try {
      new URL(v);
    } catch {
      console.error(`${name} 값이 URL 형식이 아닙니다 (예: https://xxxx.supabase.co) — 앞 4글자: "${v.slice(0, 4)}"`);
      process.exit(1);
    }
    if (!new URL(v).host.endsWith(".supabase.co")) console.warn(`[env] ${name} 이(가) *.supabase.co 주소가 아닙니다 — CI 시크릿 값을 확인하세요.`);
  }
  return v;
}

export function supabaseAdmin(): SupabaseClient<Database> {
  return createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );
}

/** 예전(Riftcodex) 스냅샷 모양의 카드 — 콘텐츠 스크립트들이 이 모양을 가정하고 짜여 있다. */
export type LegacyCard = {
  name: string;
  collector_number: number;
  set: { set_id: string };
  classification: { type: string; rarity: string; domain: string[] };
  attributes: { energy: number | null; might: number | null };
};

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/**
 * data/cards.json(playriftbound 스냅샷 `{en, ko, setMax}`)을 예전 Riftcodex 모양으로 바꿔 돌려준다.
 * 이름은 영문 정식명: 레전드 = "챔피언 - 칭호"(스타터는 "(Starter)"), 챔피언 = "이름 - 부제",
 * 변형은 "(Alternate Art)"/"(Overnumbered)"/"(Signature)" 접미사 — cardService 와 같은 규칙.
 * 카드 소스를 바꾼 뒤 `raw.cards ?? raw.items ?? []` 로 읽던 스크립트가 조용히 빈 목록을 받던 문제를 막는다.
 */
export function loadLegacyCards(): LegacyCard[] {
  const raw = JSON.parse(readFileSync(new URL("../data/cards.json", import.meta.url), "utf8"));
  if (!Array.isArray(raw?.en)) throw new Error("data/cards.json 형식이 예상과 다릅니다 (npm run sync:cards 로 다시 생성하세요)");
  const setMax: Record<string, number> = raw.setMax ?? {};

  return raw.en.map((c: any): LegacyCard => {
    const setId = String(c.set?.value?.id ?? "").toUpperCase();
    const type = String(c.cardType?.type?.[0]?.id ?? "unit");
    const tag = c.tags?.tags?.[0];
    let name = String(c.name ?? "").trim();
    if (type === "legend" && tag) name = `${tag} - ${name}${c.subtitle ? ` (${c.subtitle})` : ""}`;
    else if (c.subtitle) name = `${name} - ${c.subtitle}`;

    const num = Number(c.collectorNumber);
    const suffix = /^[A-Z]+-\d+([a-z]|\*)\//.exec(c.publicCode ?? "")?.[1];
    const showcase = c.rarity?.value?.id === "showcase";
    if (showcase) {
      if (suffix === "*") name += " (Signature)";
      else if (setMax[setId] != null && num > setMax[setId]) name += " (Overnumbered)";
      else name += " (Alternate Art)";
    }

    return {
      name,
      collector_number: num,
      set: { set_id: setId },
      classification: {
        type: cap(type),
        rarity: cap(String(c.rarity?.value?.id ?? "")),
        domain: (c.domain?.values ?? []).map((d: any) => cap(String(d.id))),
      },
      attributes: { energy: c.energy?.value?.id ?? null, might: c.might?.value?.id ?? null },
    };
  });
}
