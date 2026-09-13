/**
 * 리프트바운드 '오리진' 한국 대회 시즌 공지를 /reports(소식)에 발행한다.
 *   npx tsx scripts/post-news-origin-op.ts
 * - 같은 slug 가 있으면 갱신, 없으면 삽입 (idempotent).
 * env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * 출처: https://playriftbound.com/ko-kr/news/announcements/kr-origin-op-notice/ (2026-09-12 발행)
 */
import { loadEnv, supabaseAdmin } from "./_shared";

loadEnv();

const ADMIN_EMAIL = "shsshs010607@gmail.com";
const SLUG = "riftbound-origin-kr-op-notice";
const TITLE = "리프트바운드 '오리진' 출시 & 한국 대회 시즌 안내";
const EXCERPT =
  "9/18 정식 출시부터 12월 코리아 메이저까지 — 넥서스 나이트·스토어 예선·오픈 예선 일정 총정리.";

const BODY = `> 라이엇 게임즈가 리프트바운드 첫 세트 **'오리진'** 한국 출시와 함께 대회 시즌 일정을 공식 발표했습니다. (2026-09-12)

## 핵심 일정

| 일정 | 날짜 |
|---|---|
| 오리진 정식 출시 | **2026년 9월 18일** |
| 넥서스 나이트 · 스토어 예선 | 2026년 9월 ~ 11월 |
| 오픈 예선 | 2026년 10월 17~18일 |
| 코리아 메이저 | 2026년 12월 5~6일 |

## 넥서스 나이트

전국 카드샵에서 매주 열리는 정기 플레이 프로그램. 초심자부터 숙련자까지 참여할 수 있고, 넥서스 나이트 프로모 팩(특별 'GG EZ 티모' 카드 포함) + 출시 기념 프로모 팩을 받을 수 있습니다.

## 스토어 예선

라이엇 게임즈 공식 인정 매장에서 열리는 경쟁 이벤트. 3판 2선승 1대1, 스위스 라운드 후 결선 토너먼트로 진행됩니다. 상위 32인에게 프로모 카드, **매장 예선 상위 2명**에게 코리아 메이저 참가권이 주어집니다.

## 오픈 예선 (10/17~18)

- 장소: 서울 스페이스쉐어 중부센터
- 규모: 최대 200명
- 보상: 총 500만 원 상당 상금·상품 + 코리아 메이저 참가권

## 코리아 메이저 (12/5~6)

- 장소: 양재 aT센터
- 규모: 500명 이상
- 보상: 총 1,000만 원 상금 + Standard Plated Legends + **글로벌 대회 참가권**

---

정확한 매장별 일정·참가 신청은 playriftbound.com "매장 찾기"·"이벤트" 탭에서 확인하세요. 리바지지 [대회 캘린더](/tournaments)에도 반영해뒀습니다.

*출처: [playriftbound.com 공식 공지](https://playriftbound.com/ko-kr/news/announcements/kr-origin-op-notice/) · 세부 내용은 추후 공지에 따라 달라질 수 있습니다.*`;

async function main() {
  const db = supabaseAdmin();
  const { data: users } = await db.auth.admin.listUsers({ perPage: 200 });
  const admin = users.users.find((u) => u.email === ADMIN_EMAIL);
  if (!admin) throw new Error(`관리자(${ADMIN_EMAIL}) 계정을 찾지 못했습니다.`);

  const { data: existing } = await db
    .from("reports")
    .select("id")
    .eq("slug", SLUG)
    .maybeSingle();

  const row = {
    slug: SLUG,
    title: TITLE,
    excerpt: EXCERPT,
    body: BODY,
    cover_image_url: null,
    tag: "공지",
    status: "published" as const,
    author_id: admin.id,
  };

  if (existing) {
    const { error } = await db.from("reports").update(row).eq("id", existing.id);
    if (error) throw error;
    console.log(`갱신: ${TITLE}`);
  } else {
    const { error } = await db
      .from("reports")
      .insert({ ...row, published_at: new Date().toISOString() });
    if (error) throw error;
    console.log(`발행: ${TITLE}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
