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
};

const EVENTS: EventSeed[] = [
  {
    name: "리프트바운드 '오리진' 출시 기념 이벤트 @ GGX",
    slug: "riftbound-origin-launch-ggx",
    description: [
      "라이엇 게임즈 실물 TCG '리프트바운드' 한국어판 출시(9/18)를 기념하는 오프라인 이벤트.",
      "서울 동대문 GGX(젠지 지지엑스) 내 리프트바운드 전용 매장에서 '오리진' 부스터 구매 및 플레이가 가능하며,",
      "이벤트 기간에만 얻을 수 있는 한정 프로모 카드 증정 기회가 주어진다.",
      "한국어판 부스터에는 한국 전통 설화 구미호를 모티브로 한 '아리, 구미호' 특별 카드가 포함된다.",
      "",
      "※ 같은 기간 용산 아이파크몰 리빙파크 3층 '도파민 스테이션'(9/18~9/30)에서도 출시 프로모션이 진행된다.",
    ].join(" "),
    format: "출시 기념 이벤트 · 프로모 카드 증정 · 자유 대전 · 전용 매장 운영",
    starts_at: "2026-09-18T11:00:00+09:00",
    ends_at: "2026-09-23T22:00:00+09:00",
    location: "GGX (서울 중구 을지로 264 던던 B3층 · 동대문역사문화공원역 12번 출구 연결)",
    organizer: "라이엇 게임즈 · 젠지 GGX",
    status: "upcoming",
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
