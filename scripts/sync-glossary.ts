/**
 * src/content/glossary.ts → Supabase glossary_terms 로 upsert.
 *
 *   npx tsx scripts/sync-glossary.ts
 *
 * 필요 env (.env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * name_en 을 매칭 키로 쓰므로, Riot 공식 한글명이 나오면 glossary.ts 의 term/official 만
 * 바꿔 다시 실행하면 전체가 갱신된다.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { GLOSSARY } from "../src/content/glossary";

// .env.local 로드 (dotenv 없이 간단 파싱)
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 필요 (.env.local)");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const rows = GLOSSARY.map((t) => ({
  name_en: t.en,
  term: t.term,
  is_official: t.official ?? false,
  symbol: t.symbol ?? null,
  category: t.category,
  definition: t.definition,
  related_terms: t.related ?? [],
  card_searchable: t.cardSearchable ?? false,
}));

const { error, count } = await supabase
  .from("glossary_terms")
  .upsert(rows, { onConflict: "name_en", count: "exact" });

if (error) {
  console.error("upsert 실패:", error.message);
  process.exit(1);
}
console.log(`✓ glossary_terms ${count ?? rows.length}건 동기화 완료`);
