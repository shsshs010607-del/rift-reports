/**
 * 리프트 리포트(도메인 해설) 시리즈를 커뮤니티 report 게시판에 발행/갱신한다.
 *   npx tsx scripts/post-rift-report.ts          # 전부
 *   npx tsx scripts/post-rift-report.ts calm     # 특정 도메인만
 *
 * - 카드 목록은 data/cards.json 에서 생성 → 2색 카드는 두 도메인 글 모두에 나온다.
 * - 같은 제목이 있으면 본문만 갱신 (idempotent). is_notice + is_pinned.
 * env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { readFileSync } from "node:fs";
import { loadEnv, supabaseAdmin } from "./_shared";

loadEnv();

const ADMIN_EMAIL = "shsshs010607@gmail.com";

// ── 카드 데이터 ────────────────────────────────────────────────
type RawCard = {
  name: string;
  classification?: { type?: string; rarity?: string; domain?: string[] };
  attributes?: { energy?: number | null };
};
const raw = JSON.parse(readFileSync(new URL("../data/cards.json", import.meta.url), "utf8"));
const CARDS: RawCard[] = Array.isArray(raw) ? raw : raw.cards ?? raw.items ?? [];
const KO: Record<string, { n?: string }> = JSON.parse(
  readFileSync(new URL("../data/cards-ko.json", import.meta.url), "utf8"),
).map;
const kkey = (n: string) => n.toLowerCase().replace(/\s*\(.*?\)\s*/g, "").trim();
const ko = (n: string) => KO[kkey(n)]?.n ?? n;
const RANK: Record<string, number> = { Epic: 3, Rare: 2, Uncommon: 1 };

const DOMAIN_LABEL: Record<string, string> = {
  Fury: "분노", Calm: "침착", Mind: "지혜", Body: "육체", Chaos: "혼돈", Order: "질서",
};

/** 받침 유무 → 조사 선택 */
function hasJong(word: string): boolean {
  const ch = word.charCodeAt(word.length - 1);
  if (ch < 0xac00 || ch > 0xd7a3) return false;
  return (ch - 0xac00) % 28 !== 0;
}
const iRan = (w: string) => w + (hasJong(w) ? "이란" : "란");
const eulReul = (w: string) => w + (hasJong(w) ? "을" : "를");

function pool(D: string) {
  return CARDS.filter(
    (c) =>
      (c.classification?.domain ?? []).includes(D) &&
      !/\((Signature|Overnumbered|Alternate Art)\)/.test(c.name),
  );
}
function pick(list: RawCard[], n: number) {
  const seen = new Set<string>();
  return list
    .sort(
      (a, b) =>
        (RANK[b.classification?.rarity ?? ""] ?? 0) - (RANK[a.classification?.rarity ?? ""] ?? 0) ||
        (a.attributes?.energy ?? 99) - (b.attributes?.energy ?? 99),
    )
    .map((c) => ko(c.name))
    .filter((name) => (seen.has(name) ? false : (seen.add(name), true)))
    .slice(0, n);
}
const gallery = (names: string[]) => names.map((n) => `[[${n}]]`).join(" ");

// ── 레전드 한 줄 설명 (여러 리포트에서 공유) ──────────────────
const LEGEND_NOTE: Record<string, string> = {
  "카이사 - 공허의 딸": "탈진해 무지개 룬 추가(주문 전용) — 번·제어 주문 엔진",
  "볼리베어 - 무자비한 폭풍": "위력 5+ 유닛을 내면 룬 전개 — 큰 유닛 램프",
  "징크스 - 난폭한 말괄량이": "손패 1장 이하면 개시 단계 드로우 — 손 비우는 어그로",
  "다리우스 - 녹서스의 실력자": "군단 조건에서 탈진으로 에너지 — 카드 쏟는 미드레인지",
  "애니 - 어둠의 아이": "턴 종료 시 룬 2장 준비 — 주문 연사 (OGS 스타터)",
  "리 신 - 눈먼 수도승": "1코 탈진으로 아군 버프 — 매 턴 유닛을 키운다",
  "아리 - 구미호": "내 전장 공격하는 적에게 -1 위력 — 방어적 전장 장악",
  "야스오 - 용서받지 못한 자": "2코 탈진으로 아군 유닛 이동 — 유리한 싸움만 고른다",
  "레오나 - 여명의 빛": "적 기절 시 아군 버프 — 기절→버프 순환",
  "마스터 이 - 우주 검사": "아군 단독 방어 중 +2 위력 — 소수 정예 검사",
  "빅토르 - 아케인의 전령관": "탈진으로 1위력 신병 토큰 — 값싼 물량",
  "티모 - 날쌘 정찰병": "숨겨짐 비용 완화 + 티모 회수 — 함정·견제",
  "럭스 - 광명의 소녀": "5코 이상 주문 사용 시 드로우 — 큰 주문 컨트롤",
  "세트 - 우두머리": "버프된 유닛이 죽을 때 버프 소비해 회수 — 버프 미드레인지",
  "미스 포츈 - 현상금 사냥꾼": "탈진으로 유닛에 개입 — 유닛 옮겨다니며 광역 압박",
  "가렌 - 데마시아의 힘": "유닛 4명+ 전장 정복 시 드로우 2장 — 물량 + 카드",
};

// ── 도메인별 편집 내용 ────────────────────────────────────────
type Ed = {
  n: number;
  color: string;
  hook: string;
  essence: string;
  para: string;
  keywords: [string, string][];
  strengths: [string, string, string]; // 강점, 약점, 파트너
};
const EDIT: Record<string, Ed> = {
  Fury: {
    n: 1,
    color: "빨강",
    hook: "6색 중 가장 공격적인 색, 분노.",
    essence: "상대 유닛과 넥서스에 피해를 직접 꽂고, 공격할 때 더 세지는 유닛으로 게임을 짧게 끝낸다.",
    para: "분노는 가장 빠르고 직접적인 색입니다. 침착이 장기전을, 지혜가 카드 이득을 노린다면 분노는 시간을 안 줍니다.",
    keywords: [
      ["직접 피해(\"번\")", "전투 없이 피해를 주는 주문 — 유성, 이케시아 폭우, 초강력 초토화 로켓"],
      ["[맹공]", "공격자일 때 위력 상승 — 선공이 곧 이득"],
      ["[가속]", "분노 룬을 추가로 내면 탈진 없이 등장 → 나오자마자 공격"],
    ],
    strengths: [
      "상대 계획 완성 전에 짧게 끝낸다",
      "장기전 · 넥서스 회복 · 광역 제거",
      "지혜(주문) · 혼돈(어그로) · 육체(큰 유닛)",
    ],
  },
  Calm: {
    n: 2,
    color: "초록",
    hook: "분노의 정반대편, 시간을 내 편으로 만드는 색 침착.",
    essence: "유닛을 버프로 영구히 키우고, 방어와 견제로 시간을 벌어 게임이 길어질수록 유리해진다.",
    para: "침착은 천천히 강해지며 후반에 이기는 색입니다. 소수의 유닛을 계속 키우고 방어 카드로 버팁니다.",
    keywords: [
      ["버프(Buff)", "유닛에 영구 +위력 — 규율, 막기"],
      ["기절(Stun)", "유닛을 한 턴 쉬게 함 — 레오나의 핵심 조건"],
      ["단독 방어", "마스터 이는 유닛이 혼자 방어할 때 +2 — 소수 정예"],
    ],
    strengths: [
      "장기전 · 유닛 밸류 · 방어",
      "빠른 어그로 · 초반 압박 · 넥서스 레이스",
      "질서(물량) · 육체(전투) · 지혜(카드)",
    ],
  },
  Mind: {
    n: 3,
    color: "파랑",
    hook: "카드 수와 정보로 상대를 압도하는 색 지혜.",
    essence: "드로우와 토큰으로 자원을 불리고, 숨겨짐으로 정보를 가려 상대가 계획을 못 세우게 한다.",
    para: "지혜는 자원·카드·정보 우위로 이기는 색입니다. 큰 주문, 값싼 토큰, 함정으로 판을 굴립니다.",
    keywords: [
      ["드로우", "럭스는 5코 이상 주문을 쓰면 카드 1장 — 고코스트 주문 컨트롤"],
      ["토큰", "빅토르는 탈진으로 신병 토큰 — 몸값 싼 물량"],
      ["[숨겨짐]", "카드를 뒤집어 두었다가 공개 — 티모의 정체성"],
    ],
    strengths: [
      "카드 우위 · 유연함 · 장기전",
      "빠른 압박 · 넥서스 직접 피해 · 손 말림",
      "질서(토큰) · 혼돈(변칙) · 분노(번)",
    ],
  },
  Body: {
    n: 4,
    color: "주황",
    hook: "큰 유닛과 전투로 전장을 지배하는 색 육체.",
    essence: "위력 높은 유닛으로 전장을 직접 장악하고, 개입으로 유닛을 옮겨 원하는 싸움을 만든다.",
    para: "육체는 유닛 스탯과 전투로 밀어붙이는 색입니다. 필드에서 이기면 그대로 게임을 가져갑니다.",
    keywords: [
      ["큰 유닛", "볼리베어 - 위압적인(12코 10/2) 등 필드 압도"],
      ["[개입](Roam)", "유닛이 전장에서 전장으로 이동 — 미스 포츈의 핵심"],
      ["정복 보상", "가렌은 유닛 4명 이상 전장을 정복하면 카드 2장"],
    ],
    strengths: [
      "필드 장악 · 전투 · 미드레인지 파워",
      "광역 제거 · 번 · 넥서스 레이스",
      "질서(물량) · 분노(피니시) · 침착(버프)",
    ],
  },
  Chaos: {
    n: 5,
    color: "보라",
    hook: "변칙과 고위험 고보상의 색 혼돈.",
    essence: "카드를 버리고 되살리고, 상대 손·덱을 흔들며, 폐기장을 자원처럼 쓴다.",
    para: "혼돈은 예측 불가능한 변수를 만드는 색입니다. 안정성을 포기하는 대신 폭발력과 교란을 얻습니다.",
    keywords: [
      ["버리기/재활용", "초강력 초토화 로켓은 정복 시 손으로 회수 — 자원 순환"],
      ["폐기장 활용", "불멸의 불사조처럼 폐기장에서 다시 나오는 카드"],
      ["손·덱 교란", "짜인 패 · 바래지는 기억 · 해로윙"],
    ],
    strengths: [
      "자원 순환 · 상대 플랜 교란 · 폐기장 밸류",
      "일관성 · 폐기장 견제 · 안정적인 컨트롤",
      "분노(어그로) · 지혜(카드) · 육체(개입)",
    ],
  },
  Order: {
    n: 6,
    color: "노랑",
    hook: "머릿수로 이기는 색 질서.",
    essence: "값싼 유닛을 넓게 펼치고, 군단으로 시너지를 얻으며, 버프·토큰으로 머릿수 싸움을 지배한다.",
    para: "질서는 물량과 군단의 색입니다. 한 마리 한 마리는 약해도 함께 있으면 강해집니다.",
    keywords: [
      ["[군단](Legion)", "이번 턴에 카드를 사용했으면 추가 효과 — 다리우스의 조건"],
      ["토큰/물량", "빅토르 신병 토큰, 선봉대 소집, 대전략"],
      ["버프 확산", "화합의 인장 · 선봉대 투구로 필드 전체 강화"],
    ],
    strengths: [
      "넓은 필드 · 버프 시너지 · 안정적인 전개",
      "광역 제거 · 큰 단일 유닛 · 느린 시작",
      "육체(전투) · 지혜(토큰) · 침착(버프)",
    ],
  },
};

function buildBody(D: string): string {
  const e = EDIT[D];
  const label = DOMAIN_LABEL[D];
  const p = pool(D);
  const legends = p
    .filter((c) => c.classification?.type === "Legend")
    .map((c) => ko(c.name))
    .filter((n, i, a) => a.indexOf(n) === i);
  const spells = pick(p.filter((c) => c.classification?.type === "Spell"), 8);
  const units = pick(
    p.filter((c) => c.classification?.type === "Unit" && !/\/\/|token/i.test(c.name)),
    6,
  );
  const gear = pick(p.filter((c) => c.classification?.type === "Gear"), 3);

  const legendLines = legends
    .map((n) => {
      const card = CARDS.find((c) => ko(c.name) === n);
      const d = (card?.classification?.domain ?? []).map((x) => DOMAIN_LABEL[x] ?? x).join("+");
      const note = LEGEND_NOTE[n] ? ` — ${LEGEND_NOTE[n]}` : "";
      return `- **${n.split(" - ")[0]}** (${d})${note}`;
    })
    .join("\n");

  return `> 리프트 리포트 ${e.n}편. ${e.hook}

## ${iRan(label)}

${e.para} 상징색은 ${e.color}.

> ${e.essence}

## 핵심 키워드

${e.keywords.map(([k, v]) => `- **${k}** — ${v}`).join("\n")}

## ${label} 레전드

${label} 레전드는 전부 2색입니다. 항상 파트너 색과 함께 갑니다.

${gallery(legends)}

${legendLines}

## 주요 주문

${gallery(spells)}

## 주요 유닛 · 도구

${gallery([...units, ...gear])}

> 카드 아래 **색 점이 2개면 2색 카드**입니다. 챔피언 전용 주문(용의 분노 등)은 그 챔피언의 두 색을 모두 가져 여러 도메인 리포트에 나옵니다.

## ${eulReul(label)} 쓴다면

| | |
|---|---|
| **강점** | ${e.strengths[0]} |
| **약점** | ${e.strengths[1]} |
| **파트너** | ${e.strengths[2]} |

---
👉 [${label} 카드 전체 보기](/cards?domain=${slugOf(D)}) · [메타 덱](/decks) · [덱 티어리스트](/tiers)

*리프트 리포트 · 리바지지 · 한국 스탠다드(OGN·OGS) 기준. 정식 한글명은 라이엇 공식 발표 후 반영. 잘못된 내용은 댓글로.*`;
}

const slugOf = (D: string) =>
  ({ Fury: "fury", Calm: "calm", Mind: "mind", Body: "body", Chaos: "chaos", Order: "order" })[D]!;

async function main() {
  const only = process.argv[2]?.toLowerCase();
  const db = supabaseAdmin();
  const { data: users } = await db.auth.admin.listUsers({ perPage: 200 });
  const admin = users.users.find((u) => u.email === ADMIN_EMAIL);
  if (!admin) throw new Error(`관리자(${ADMIN_EMAIL}) 계정을 찾지 못했습니다.`);

  for (const D of Object.keys(EDIT)) {
    if (only && only !== slugOf(D) && only !== DOMAIN_LABEL[D]) continue;
    const title = `리프트 리포트 #${EDIT[D].n} — ${DOMAIN_LABEL[D]}(${D})`;
    const body = buildBody(D);

    const { data: existing } = await db
      .from("posts")
      .select("id")
      .eq("category", "report")
      .eq("title", title)
      .maybeSingle();

    if (existing) {
      const { error } = await db
        .from("posts")
        .update({ body, is_notice: true, is_pinned: true, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (error) throw error;
      console.log(`갱신: ${title}`);
    } else {
      const { data, error } = await db
        .from("posts")
        .insert({ category: "report", title, body, author_id: admin.id, is_notice: true, is_pinned: true })
        .select("id")
        .single();
      if (error) throw error;
      console.log(`발행: ${title} → ${data.id}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
