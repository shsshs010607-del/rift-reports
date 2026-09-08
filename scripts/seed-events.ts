/**
 * 리프트바운드 오프라인 이벤트/대회 시드.
 *   npx tsx scripts/seed-events.ts
 * - 같은 slug 가 있으면 갱신, 없으면 삽입 (idempotent).
 * env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { loadEnv, supabaseAdmin } from "./_shared";

loadEnv();

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80) || `event-${Date.now()}`;

type EventSeed = {
  name: string;
  slug?: string;
  description: string;
  format: string;
  starts_at: string; // ISO (KST 기준 시각을 +09:00 로)
  ends_at: string;
  location: string;
  organizer: string;
  status: "upcoming" | "ongoing" | "finished";
  category: "official" | "shop" | "community";
};

const EVENTS: EventSeed[] = [
  {
    name: "리프트바운드 '오리진' 출시 기념 이벤트 @ GGX",
    slug: "riftbound-origin-launch-ggx",
    description: [
      "라이엇 게임즈 실물 TCG '리프트바운드' 한국어판 출시(9/18)를 기념하는 오프라인 이벤트.",
      "서울 동대문 GGX(젠지 지지엑스) 내 리프트바운드 전용 매장에서 '오리진' 부스터·챔피언 덱·증명의 전장 등",
      "한국어판 제품을 모두 구매할 수 있고, 룰을 배우고 플레이하며 이벤트 한정 프로모 카드를 얻을 기회가 주어진다.",
      "한국어판 부스터에는 한국 전통 설화 구미호를 모티브로 한 '아리, 구미호' 특별 카드가 포함된다.",
    ].join(" "),
    format: "출시 기념 이벤트 · 프로모 카드 증정 · 자유 대전 · 전용 매장 운영",
    starts_at: "2026-09-18T11:00:00+09:00",
    ends_at: "2026-09-23T22:00:00+09:00",
    location: "GGX (서울 중구 을지로 264 던던 B3층 · 동대문역사문화공원역 12번 출구 연결)",
    organizer: "라이엇 게임즈 · 젠지 GGX",
    status: "upcoming",
    category: "official",
  },
  {
    name: "리프트바운드 '오리진' 출시 팝업 @ 도파민 스테이션",
    slug: "riftbound-origin-launch-dopamine-station",
    description: [
      "리프트바운드 한국어판 출시 기념 팝업.",
      "용산 아이파크몰 리빙파크 3층 '도파민 스테이션'에서 9/18~9/30 동안 진행된다.",
      "'오리진' 부스터·챔피언 덱 등 한국어판 제품 구매, 룰 강습·시연 플레이,",
      "이벤트 기간에만 얻을 수 있는 한정 프로모 카드 증정이 함께 진행된다.",
    ].join(" "),
    format: "출시 기념 팝업 · 프로모 카드 증정 · 시연 플레이 · 제품 판매",
    starts_at: "2026-09-18T10:30:00+09:00",
    ends_at: "2026-09-30T22:00:00+09:00",
    location: "도파민 스테이션 (서울 용산구 한강대로23길 55 아이파크몰 리빙파크 3층 · 용산역)",
    organizer: "라이엇 게임즈",
    status: "upcoming",
    category: "official",
  },
  {
    name: "넥서스 나이트 (Nexus Nights) — 주간 매장 대회",
    slug: "riftbound-nexus-nights",
    description: [
      "리프트바운드 공식 주간 커뮤니티 대회 프로그램.",
      "출시 이후 참여 매장에서 매주 열리며, 룰을 배우고 플레이어와 만나 상품을 걸고 겨룬다.",
      "한국 한정 프로모 카드 'GG EZ 티모(GG EZ Teemo)'를 획득할 기회가 주어진다.",
      "참여 매장·요일·시간은 각 카드샵 공지를 확인하세요. (첫 한국 단독 공식 투어 대회는 2026년 12월 예정)",
    ].join(" "),
    format: "주간 매장 대회 · 스탠다드(한국 발매 세트) · 프로모 'GG EZ 티모' 배포",
    starts_at: "2026-09-18T19:00:00+09:00",
    ends_at: "2026-12-31T22:00:00+09:00",
    location: "전국 참여 카드샵 (매장별 공지)",
    organizer: "라이엇 게임즈 (매장 운영)",
    status: "upcoming",
    category: "shop",
  },
];

async function main() {
  const db = supabaseAdmin();
  for (const e of EVENTS) {
    const slug = e.slug ? slugify(e.slug) : slugify(e.name);
    const { data: existing } = await db
      .from("tournaments")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    const row = {
      slug,
      name: e.name,
      description: e.description,
      format: e.format,
      status: e.status,
      category: e.category,
      starts_at: new Date(e.starts_at).toISOString(),
      ends_at: new Date(e.ends_at).toISOString(),
      location: e.location,
      is_online: false,
      organizer: e.organizer,
      registration_url: null,
      prize_pool: null,
      banner_url: null,
    };

    if (existing) {
      const { error } = await db.from("tournaments").update(row).eq("id", existing.id);
      if (error) throw error;
      console.log("updated", slug);
    } else {
      const { error } = await db.from("tournaments").insert(row);
      if (error) throw error;
      console.log("inserted", slug);
    }
  }
  console.log("완료");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
