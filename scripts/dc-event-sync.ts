/**
 * 디시 리프트바운드 갤러리(🎁이벤트) 새 매장 글 → 매장 정보 게시판 + 대회 탭 + #매장-소식 디스코드.
 *   npx tsx scripts/dc-event-sync.ts            (.env.local 또는 CI 시크릿)
 *   npx tsx scripts/dc-event-sync.ts --dry      (DB·디스코드에 쓰지 않고 결과만 출력)
 *
 * env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, DISCORD_WEBHOOK_URL_STORE
 * 상태: data/dc-event-seen.json (처리·스킵한 글 번호) — 워크플로가 변경 시 커밋한다.
 *
 * 규칙: 원문 링크·출처 언급 금지 / 이미 지난 행사·추첨 결과·단순 판매 안내·이미지뿐인 글은 게시하지 않고 seen 에만 기록.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { loadEnv, requireEnv, supabaseAdmin } from "./_shared";

loadEnv();

const DRY = process.argv.includes("--dry");
const SEEN_FILE = new URL("../data/dc-event-seen.json", import.meta.url);
const AUTHOR_ID = "a8b4840f-4bf0-4d2f-9200-92c8e429e355"; // RIBAGG_HOOD (admin)
const SITE = "https://riba.gg";
const MODEL = "claude-haiku-4-5-20251001";
const MIN_POST_NO = 3300; // 이보다 오래된 글은 보지 않는다 (9/15 이전)
const MAX_PER_RUN = 15;

const H = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
  "accept-language": "ko-KR,ko;q=0.9",
};

type Seen = { seen: number[]; lastCheckedAt?: string };
const loadSeen = (): Seen =>
  existsSync(SEEN_FILE) ? JSON.parse(readFileSync(SEEN_FILE, "utf8")) : { seen: [] };

const decode = (s: string) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const htmlToText = (html: string) =>
  decode(
    html
      .replace(/<script[\s\S]*?<\/script>/g, "")
      .replace(/<style[\s\S]*?<\/style>/g, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|tr|h\d)>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/[ \t​]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();

async function listEventPostNos(): Promise<number[]> {
  const res = await fetch(
    "https://gall.dcinside.com/mgallery/board/lists/?id=riftbound&sort_type=N&search_head=40&page=1",
    { headers: H },
  );
  if (!res.ok) throw new Error(`목록 요청 실패: HTTP ${res.status}`);
  const html = await res.text();
  const rows = html.split('<tr class="ub-content').slice(1);
  const nos: number[] = [];
  for (const row of rows) {
    const no = Number(row.match(/data-no="(\d+)"/)?.[1]);
    const subject = row.match(/class="gall_subject"[^>]*>([\s\S]*?)<\/td>/)?.[1] ?? "";
    if (no && subject.includes("이벤트")) nos.push(no);
  }
  if (nos.length === 0) throw new Error("이벤트 글을 하나도 찾지 못함 — 차단되었거나 페이지 구조가 바뀜");
  return nos;
}

async function fetchPost(no: number) {
  const res = await fetch(`https://gall.dcinside.com/mgallery/board/view/?id=riftbound&no=${no}`, { headers: H });
  if (!res.ok) throw new Error(`글 ${no} 요청 실패: HTTP ${res.status}`);
  const html = await res.text();
  const title = decode(html.match(/<span class="title_subject">([\s\S]*?)<\/span>/)?.[1] ?? "").trim();
  const writer = decode(html.match(/class="gall_writer ub-writer"[^>]*data-nick="([^"]*)"/)?.[1] ?? "");
  const start = html.indexOf('class="write_div"');
  const end = html.indexOf("btn_recommend_box", start);
  const bodyHtml = start >= 0 ? html.slice(start, end > start ? end : start + 60000) : "";
  const images = (bodyHtml.match(/<img /g) ?? []).length;
  const text = htmlToText(bodyHtml.replace(/^[^>]*>/, ""));
  return { no, title, writer, text: text.slice(0, 5000), images };
}

const kstToday = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

type Extracted = {
  publish: boolean;
  reason?: string;
  title?: string;
  body?: string;
  events?: {
    name: string;
    starts_at: string;
    location: string;
    organizer: string;
    format?: string;
    prize_pool?: string | null;
    description?: string;
    registration_url?: string | null;
  }[];
};

async function extract(post: { title: string; writer: string; text: string; images: number }): Promise<Extracted> {
  const system = `너는 한국 리프트바운드(Riftbound TCG) 커뮤니티 사이트 RIBA.GG의 운영 도우미다. 카드샵이 올린 이벤트 공지를 사이트 "매장 정보" 게시판용으로 정리한다.
오늘 날짜(KST): ${kstToday()}.

반드시 JSON 한 개만 출력한다(설명·코드블록 금지). 형식:
{"publish":boolean,"reason":"게시 안 하는 이유(짧게)","title":"[매장 소식] 매장명 - 핵심 요약","body":"마크다운 본문","events":[{"name":"[매장명] 이벤트명 날짜","starts_at":"2026-09-27T13:00:00+09:00","location":"매장명 (시도 시군구)","organizer":"매장명","format":"짧은 포맷 설명","prize_pool":"상품 요약 또는 null","description":"참가비·접수 등 1~2문장","registration_url":null}]}

publish=false 로 해야 하는 경우: 이미 지난 행사만 다룸 / 추첨·대진 결과 발표 / 단순 상품 판매·입고 안내 / 내용이 너무 빈약(본문 텍스트가 거의 없고 이미지뿐) / 광고·잡담.
게시 규칙: 원문 링크·디시·출처를 절대 언급하지 않는다. 개인정보(전화번호 등) 제외. 사실만 간결히, 과장 금지. 본문은 첫 줄에 "**매장명**이 …했습니다." 식 한 문장 요약 후 - 목록. 일시는 "9월 27일(일) 오후 1시"처럼 요일 포함. 매장이 올린 카카오 오픈채팅·매장 공식 링크는 써도 되지만 디시 링크는 금지.
events: 날짜와 시각이 명확하고 오늘 이후인 대회/이벤트만 각각 1건. 주 단위 반복 안내(구체 날짜 없음), 참가비 없는 단순 강습 상시 안내, 시간 불명은 넣지 않는다. starts_at 은 KST(+09:00) ISO.`;

  const user = `제목: ${post.title}\n글쓴이: ${post.writer}\n첨부 이미지 수: ${post.images}\n본문:\n${post.text || "(본문 텍스트 없음)"}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": requireEnv("ANTHROPIC_API_KEY"),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model: MODEL, max_tokens: 2500, temperature: 0, system, messages: [{ role: "user", content: user }] }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = (await res.json()) as { content: { type: string; text?: string }[] };
  const raw = j.content.find((c) => c.type === "text")?.text ?? "";
  const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  return JSON.parse(json) as Extracted;
}

const norm = (s: string) => s.toLowerCase().replace(/[\s()\[\]·\-_.]/g, "");

async function notifyDiscord(title: string, body: string, postId: string) {
  const urls = (process.env.DISCORD_WEBHOOK_URL_STORE ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const payload = JSON.stringify({
    username: "리바지지 소식",
    embeds: [
      {
        title,
        description: body.replace(/[*_`#>[\]()-]/g, "").slice(0, 180),
        url: `${SITE}/community/post/${postId}`,
        color: 0x5865f2,
      },
    ],
  });
  for (const u of urls) {
    const r = await fetch(u, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload });
    if (r.status >= 300) console.warn(`  디스코드 응답 ${r.status}`);
  }
  await new Promise((r) => setTimeout(r, 1500));
}

async function main() {
  const seenState = loadSeen();
  const seen = new Set(seenState.seen);
  const only = process.env.DC_ONLY?.split(",").map(Number); // 테스트용: 특정 글 번호만 강제 처리
  const nos = only ?? (await listEventPostNos()).filter((n) => n >= MIN_POST_NO && !seen.has(n)).sort((a, b) => a - b);
  console.log(`[dc-event-sync]${DRY ? " (dry)" : ""} 새 글 ${nos.length}건`, nos.join(","));
  if (nos.length === 0) return;

  if (!DRY) {
    requireEnv("NEXT_PUBLIC_SUPABASE_URL");
    requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    requireEnv("DISCORD_WEBHOOK_URL_STORE");
  }
  requireEnv("ANTHROPIC_API_KEY");
  const db = DRY ? null : supabaseAdmin();

  let posted = 0;
  for (const no of nos.slice(0, MAX_PER_RUN)) {
    try {
      const post = await fetchPost(no);
      console.log(`#${no} 본문 ${post.text.length}자, 이미지 ${post.images}, 글쓴이 ${post.writer}, 제목 ${post.title.slice(0, 30)}`);
      const ex = await extract(post);
      console.log(`#${no} ${post.title.slice(0, 40)} → ${ex.publish ? "게시" : "스킵(" + (ex.reason ?? "") + ")"}`);

      if (ex.publish && ex.title && ex.body) {
        if (DRY) {
          console.log("  제목:", ex.title, "\n  이벤트:", JSON.stringify(ex.events ?? []));
        } else {
          // 같은 제목이 이미 있으면(세션 크론 등 다른 경로로 올라간 경우) 중복 게시하지 않는다.
          const { data: dup } = await db!.from("posts").select("id").eq("category", "tournament").eq("title", ex.title).limit(1);
          if (!dup?.length) {
            const { data, error } = await db!
              .from("posts")
              .insert({ category: "tournament", title: ex.title, body: ex.body, author_id: AUTHOR_ID, is_notice: false, tags: ["매장소식"] })
              .select("id")
              .single();
            if (error) throw new Error(`posts insert: ${error.message}`);
            await notifyDiscord(ex.title, ex.body, data.id);
            posted++;
          }

          for (const ev of ex.events ?? []) {
            const start = new Date(ev.starts_at);
            if (Number.isNaN(start.getTime()) || start.getTime() < Date.now()) continue;
            const lo = new Date(start.getTime() - 3 * 3600e3).toISOString();
            const hi = new Date(start.getTime() + 3 * 3600e3).toISOString();
            const { data: near } = await db!.from("tournaments").select("organizer,name").gte("starts_at", lo).lte("starts_at", hi);
            const org = norm(ev.organizer);
            if ((near ?? []).some((t) => (t.organizer && (norm(t.organizer).includes(org) || org.includes(norm(t.organizer)))))) {
              console.log(`  대회 중복 스킵: ${ev.name}`);
              continue;
            }
            const { error } = await db!.from("tournaments").upsert(
              {
                slug: `dc-${no}-${start.toISOString().slice(0, 10)}-${norm(ev.organizer).slice(0, 12)}`.slice(0, 80),
                name: ev.name,
                description: ev.description ?? null,
                format: ev.format ?? null,
                status: "upcoming",
                starts_at: start.toISOString(),
                ends_at: null,
                location: ev.location,
                is_online: false,
                organizer: ev.organizer,
                registration_url: ev.registration_url ?? null,
                prize_pool: ev.prize_pool ?? null,
                banner_url: null,
                category: "shop",
              },
              { onConflict: "slug" },
            );
            if (error) console.warn(`  대회 등록 실패: ${error.message}`);
            else console.log(`  대회 등록: ${ev.name}`);
          }
        }
      }
      seen.add(no); // 게시·스킵 모두 처리 완료 — 실패(예외)한 글은 seen 에 안 넣어 다음 실행에서 재시도
    } catch (e) {
      console.error(`#${no} 처리 실패(다음 실행에서 재시도):`, (e as Error).message);
    }
  }

  if (!DRY) {
    seenState.seen = [...seen].sort((a, b) => a - b);
    seenState.lastCheckedAt = new Date().toISOString();
    writeFileSync(SEEN_FILE, JSON.stringify(seenState, null, 2) + "\n");
  }
  console.log(`완료: 게시 ${posted}건`);
}

main().catch((e) => {
  console.error("[dc-event-sync] 실패:", e);
  process.exit(1);
});
