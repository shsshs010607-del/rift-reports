/**
 * 카드 이미지 최적화 캐시 예열 — 배포 직후나 카드 데이터 갱신 뒤에 한 번 돌려두면,
 * 첫 방문자가 "리엇 CDN 의 2MB PNG 를 받아 변환하는" 1초+ 대기를 겪지 않는다.
 *   npx tsx scripts/warm-images.ts [https://riba.gg]
 * 카드 목록·덱 시뮬레이터가 실제로 요청하는 폭(384 / 640)만 데운다.
 */
import { readFileSync } from "node:fs";

const BASE = (process.argv[2] ?? "https://riba.gg").replace(/\/$/, "");
const WIDTHS = [384, 640];
const CONCURRENCY = 8;

const raw = JSON.parse(readFileSync(new URL("../data/cards.json", import.meta.url), "utf8"));
const urls = new Set<string>();
for (const list of [raw.ko, raw.en] as unknown[]) {
  if (!Array.isArray(list)) continue;
  for (const c of list as { cardImage?: { url?: string }; image?: { url?: string } }[]) {
    const u = c.cardImage?.url ?? c.image?.url;
    if (typeof u === "string" && u.startsWith("https://cmsassets.rgpub.io/")) urls.add(u);
  }
}

const jobs: string[] = [];
// 언박싱 시뮬레이터(public/origins-sim.html)는 리엇 CDN 에서 직접 받는다 — 같은 URL 모양(w/fm/q)으로 CDN 캐시를 데운다.
try {
  const sim = JSON.parse(readFileSync(new URL("../public/origins-cards.json", import.meta.url), "utf8"));
  for (const c of sim.cards ?? []) {
    if (typeof c.img !== "string" || !c.img.includes("cmsassets.rgpub.io")) continue;
    for (const w of [184, 220]) jobs.push(`${c.img}${c.img.includes("?") ? "&" : "?"}w=${w}&fm=webp&q=70`);
  }
} catch {
  /* 시뮬레이터 데이터가 없으면 건너뜀 */
}
const simJobs = jobs.length;
for (const u of urls) for (const w of WIDTHS) jobs.push(`${BASE}/_next/image?url=${encodeURIComponent(u)}&w=${w}&q=75`);
console.log(`이미지 ${urls.size}장 × 폭 ${WIDTHS.join("/")} + 시뮬레이터 ${simJobs}건 = 요청 ${jobs.length}건`);

let done = 0, miss = 0, fail = 0;
async function worker() {
  while (jobs.length) {
    const url = jobs.pop()!;
    try {
      const r = await fetch(url, { headers: { accept: "image/webp,image/*" }, signal: AbortSignal.timeout(30000) });
      await r.arrayBuffer();
      if (!r.ok) fail++;
      else if (url.startsWith(BASE) && r.headers.get("x-vercel-cache") !== "HIT") miss++;
    } catch {
      fail++;
    }
    if (++done % 100 === 0) console.log(`  ${done}건 처리`);
  }
}
Promise.all(Array.from({ length: CONCURRENCY }, worker)).then(() => {
  console.log(`완료 — 새로 데운 것 ${miss}건, 이미 캐시 ${done - miss - fail}건, 실패 ${fail}건`);
});
