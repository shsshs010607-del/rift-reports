# 카드샵 검색 & 매장 대회 — 설계

> 목표: ① 지역(시/도·시/군/구)별 리프트바운드 카드샵 검색 ② 매장별 대회(이벤트) 일정 제공
> 스택: Next.js App Router · Supabase(PostgreSQL + RLS) · Kakao Map JS SDK
> 기존 `tournaments` 테이블은 **대형·공식·온라인 대회**용으로 그대로 두고, 이 문서의
> `shop_events` 는 **매장 단위 주간 이벤트**를 다룬다. 나중에 `/events` 허브에서 둘을 합쳐 보여줄 수 있다.

---

## 1. 데이터 모델

### 1-1. 지역 분류 — 테이블 대신 상수

대한민국 행정구역(17 시/도 + 약 250 시/군/구)은 거의 안 바뀌므로 **정적 상수**로 관리한다.
`regions` 테이블을 만들면 조인·시드·정합성 관리 비용만 늘어난다.

```ts
// src/lib/constants.ts
export const KR_SIDO = [
  "서울","부산","대구","인천","광주","대전","울산","세종",
  "경기","강원","충북","충남","전북","전남","경북","경남","제주",
] as const;
export type KrSido = (typeof KR_SIDO)[number];

// 시/군/구는 시/도별 목록 (드롭다운용). 전체 데이터는 별도 파일로 분리 권장.
// src/lib/data/kr-sigungu.ts  →  Record<KrSido, string[]>
export const KR_SIGUNGU: Record<KrSido, readonly string[]> = { /* … */ };
```

- 샵 레코드는 `sido`(상수 검증) + `sigungu`(text) + `address_road`/`address_detail` 를 함께 저장한다.
- 시/군/구 값은 **Kakao 주소검색 API 응답에서 자동 채운다**(관리자가 주소 입력 → 좌표·시도·시군구 파싱).
- 표시는 `sido + " " + sigungu` (`"서울 강남구"`).

> **대안**: 시/군/구까지 정규화가 꼭 필요하면 `regions(code, sido, sigungu, lat, lng)` 참조 테이블 + `shops.region_code` FK. 여기서는 과설계로 판단.

### 1-2. ENUM 타입 (schema.sql 상단에 추가)

```sql
create type shop_status        as enum ('active', 'temporarily_closed', 'closed', 'pending');
create type shop_event_status  as enum ('draft', 'registering', 'registration_closed', 'ongoing', 'finished', 'cancelled');
```

- `shop_status.pending` — 커뮤니티 제보로 등록됐지만 아직 스태프 검수 전.
- `shop_event_status` — 날짜로 대부분 유추 가능하지만, "접수 마감(경기 시작 전인데 정원 참)"·"취소" 같은 상태는 명시 컬럼이 필요.

### 1-3. `shops` — 카드샵

```sql
-- ============================================================================
--  shops  — 리프트바운드 취급 카드샵
-- ============================================================================
create table shops (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,                       -- 'card-castle-gangnam'
  name           text not null check (char_length(name) between 1 and 100),

  -- 지역
  sido           text not null,                              -- KR_SIDO 값 (앱에서 검증)
  sigungu        text not null,                              -- '강남구'
  address_road   text not null,                              -- 도로명 주소
  address_detail text,                                       -- 상세(층·호)
  postal_code    text,

  -- 좌표 (Kakao Geocoder 로 등록 시점에 채움 — 렌더 시 지오코딩 안 함)
  lat            double precision,
  lng            double precision,

  -- 연락 / 부가정보
  phone          text,
  business_hours jsonb not null default '{}',                -- 아래 형식 참고
  cover_image_url text,                                      -- 대표 사진 (Storage)
  photos         text[] not null default '{}',
  description    text check (char_length(description) <= 1000),
  links          jsonb not null default '{}',                -- { naver_place, instagram, x, homepage }

  -- 공인샵
  is_official    boolean not null default false,
  official_since date,                                       -- 공인 지정일 (배지 툴팁용)

  -- 운영 / 출처
  status         shop_status not null default 'pending',
  submitted_by   uuid references profiles (id) on delete set null,   -- 커뮤니티 제보자
  verified_by    uuid references profiles (id) on delete set null,   -- 검수 스태프
  verified_at    timestamptz,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index shops_region_idx   on shops (sido, sigungu) where status = 'active';
create index shops_official_idx  on shops (is_official)   where status = 'active' and is_official;
create index shops_geo_idx       on shops (lat, lng)      where status = 'active';
create index shops_name_trgm_idx on shops using gin (name gin_trgm_ops);

create trigger shops_updated before update on shops
  for each row execute function set_updated_at();
```

`business_hours` 형식 (요일 0=일 … 6=토, 24h "HH:MM", 휴무는 null):

```json
{
  "1": { "open": "13:00", "close": "22:00" },
  "2": { "open": "13:00", "close": "22:00" },
  "6": { "open": "11:00", "close": "23:00", "note": "대회일" },
  "0": null,
  "holiday": "설·추석 당일 휴무"
}
```

### 1-4. `shop_events` — 매장 대회 (shops 1 : N)

```sql
-- ============================================================================
--  shop_events  — 매장별 대회 / 이벤트
-- ============================================================================
create table shop_events (
  id                uuid primary key default gen_random_uuid(),
  shop_id           uuid not null references shops (id) on delete cascade,

  title             text not null check (char_length(title) between 1 and 150),
  description        text,                                   -- 마크다운 허용
  poster_url        text,

  -- 일정
  starts_at         timestamptz not null,
  ends_at           timestamptz,
  registration_deadline timestamptz,                         -- 없으면 starts_at 로 간주

  -- 참가
  entry_fee         integer not null default 0 check (entry_fee >= 0),   -- KRW, 0 = 무료
  format            text not null,                           -- 'Standard' | 'Discard' | '야스오 제한' …
  format_notes      text,
  capacity          integer check (capacity is null or capacity > 0),    -- null = 제한 없음
  registered_count  integer not null default 0 check (registered_count >= 0),

  -- 진행
  status            shop_event_status not null default 'registering',
  registration_url  text,                                    -- 외부 신청 링크(선택)

  created_by        uuid references profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index shop_events_shop_idx     on shop_events (shop_id, starts_at desc);
create index shop_events_upcoming_idx on shop_events (starts_at)
  where status in ('registering', 'registration_closed', 'ongoing');

create trigger shop_events_updated before update on shop_events
  for each row execute function set_updated_at();
```

**상태 자동 전이** — cron 또는 조회 시 파생. 명시 컬럼과 파생 로직 둘 다 둔다:

```sql
-- 조회용 뷰: 날짜 기준 "실질 상태"를 계산해 붙인다
create view shop_events_public as
select e.*,
  case
    when e.status in ('draft','cancelled') then e.status
    when now() > coalesce(e.ends_at, e.starts_at + interval '6 hours') then 'finished'
    when now() >= e.starts_at then 'ongoing'
    when now() >= coalesce(e.registration_deadline, e.starts_at)
      or (e.capacity is not null and e.registered_count >= e.capacity) then 'registration_closed'
    else 'registering'
  end::shop_event_status as effective_status
from shop_events e;
```

프론트는 `effective_status` 를 "접수 중 / 접수 마감 / 진행 중 / 종료 / 취소" 로 표시.

### 1-5. (v2) `shop_event_registrations` — 사이트 내 신청

v1 은 `registered_count` 를 매장/스태프가 수동 갱신하거나 외부 링크로 처리한다.
사이트에서 직접 신청받으려면:

```sql
create table shop_event_registrations (
  event_id   uuid not null references shop_events (id) on delete cascade,
  user_id    uuid not null references profiles (id) on delete cascade,
  status     text not null default 'confirmed',   -- confirmed | waitlist | cancelled
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
-- registered_count 는 트리거로 동기화
```

### 1-6. (v2) `shop_managers` — 매장 소유자

매장주가 직접 이벤트를 올리게 하려면 `shop_managers(shop_id, user_id, role)` 링크 테이블 +
RLS 에서 "본인이 매니저인 샵의 이벤트만 쓰기" 정책. v1 은 스태프 전용.

---

## 2. RLS 정책 (policies.sql 에 추가)

```sql
alter table shops        enable row level security;
alter table shop_events  enable row level security;

-- shops ----------------------------------------------------------------------
create policy "샵 공개 읽기(활성)"  on shops for select
  using (status = 'active' or is_staff());

create policy "스태프 샵 전체 관리" on shops for all
  using (is_staff()) with check (is_staff());

-- 커뮤니티 제보: 로그인 사용자는 pending 상태로만 insert
create policy "샵 제보 등록" on shops for insert to authenticated
  with check (
    status = 'pending'
    and is_official = false
    and submitted_by = auth.uid()
  );

-- shop_events --------------------------------------------------------------
create policy "이벤트 공개 읽기" on shop_events for select
  using (
    status <> 'draft'
    and exists (select 1 from shops s where s.id = shop_id and s.status = 'active')
    or is_staff()
  );

create policy "스태프 이벤트 관리" on shop_events for all
  using (is_staff()) with check (is_staff());

-- v2: 매장 매니저 정책
-- create policy "매니저 이벤트 관리" on shop_events for all
--   using (exists (select 1 from shop_managers m where m.shop_id = shop_events.shop_id and m.user_id = auth.uid()))
--   with check (...);
```

`shop_events_public` 뷰는 `security_invoker` 로 만들어 기반 테이블 RLS 를 그대로 상속시킨다
(`create view … with (security_invoker = true)` — PG15+/Supabase 지원).

---

## 3. API / 서버 로직

Next.js App Router 기준. **읽기는 Server Component + Route Handler, 쓰기는 Server Action**.
카드 DB 어댑터(`getCardService`)처럼 Supabase 접근은 `src/lib/shops.ts` 한 곳에 모은다.

### 3-1. 조회

| 목적 | 형태 | 쿼리 파라미터 |
|---|---|---|
| 샵 목록 | `GET /api/shops` | `sido`, `sigungu`, `official`(0/1), `q`(매장명), `bbox`(지도 뷰포트), `sort`(name/recent), `page`, `size` |
| 샵 상세 + 예정 이벤트 | `GET /api/shops/[slug]` | — |
| 샵의 이벤트 목록 | `GET /api/shops/[slug]/events` | `status`(upcoming/past), `page` |
| 전국 이벤트 피드 | `GET /api/events` | `sido`, `from`, `to`, `format`, `status` |

`/shops` **페이지 자체**는 서버 컴포넌트에서 `searchParams` 로 필터를 읽어 SSR(공유 가능한 URL).
지도 뷰포트 이동 시 refetch 만 클라이언트에서 Route Handler 호출.

```ts
// src/lib/shops.ts
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export interface ShopQuery {
  sido?: string;
  sigungu?: string;
  official?: boolean;
  q?: string;
  bbox?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  page?: number;
  size?: number;
}

const PAGE = 24;

export async function searchShops(query: ShopQuery) {
  if (!hasSupabaseEnv) return { shops: [], total: 0 };
  const supabase = createClient();

  let q = supabase
    .from("shops")
    .select("id, slug, name, sido, sigungu, address_road, lat, lng, cover_image_url, is_official, phone", { count: "exact" })
    .eq("status", "active")
    .order("is_official", { ascending: false })
    .order("name", { ascending: true });

  if (query.sido) q = q.eq("sido", query.sido);
  if (query.sigungu) q = q.eq("sigungu", query.sigungu);
  if (query.official) q = q.eq("is_official", true);
  if (query.q?.trim()) q = q.ilike("name", `%${query.q.trim()}%`);
  if (query.bbox) {
    const [minLng, minLat, maxLng, maxLat] = query.bbox;
    q = q.gte("lng", minLng).lte("lng", maxLng).gte("lat", minLat).lte("lat", maxLat);
  }

  const size = query.size ?? PAGE;
  const from = ((query.page ?? 1) - 1) * size;
  const { data, error, count } = await q.range(from, from + size - 1);
  if (error) throw error;
  return { shops: data ?? [], total: count ?? 0 };
}

export async function getShop(slug: string) {
  if (!hasSupabaseEnv) return null;
  const supabase = createClient();
  const { data: shop } = await supabase.from("shops").select("*").eq("slug", slug).eq("status", "active").maybeSingle();
  if (!shop) return null;
  const { data: events } = await supabase
    .from("shop_events_public")
    .select("*")
    .eq("shop_id", shop.id)
    .order("starts_at", { ascending: true });
  return { shop, events: events ?? [] };
}
```

**Route Handler** (지도 refetch·클라이언트 필터 변경용):

```ts
// src/app/api/shops/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { searchShops } from "@/lib/shops";
import { KR_SIDO } from "@/lib/constants";

const Schema = z.object({
  sido: z.enum(KR_SIDO as unknown as [string, ...string[]]).optional(),
  sigungu: z.string().trim().min(1).max(20).optional(),
  official: z.enum(["0", "1"]).transform((v) => v === "1").optional(),
  q: z.string().trim().min(1).max(40).optional(),
  bbox: z.string().regex(/^-?\d+(\.\d+)?(,-?\d+(\.\d+)?){3}$/).optional(),
  page: z.coerce.number().int().min(1).optional(),
});

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const parsed = Schema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "잘못된 파라미터" }, { status: 400 });

  const { bbox, ...rest } = parsed.data;
  try {
    const result = await searchShops({
      ...rest,
      bbox: bbox ? (bbox.split(",").map(Number) as [number, number, number, number]) : undefined,
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600" },
    });
  } catch (e) {
    console.error("[api/shops]", e);
    return NextResponse.json({ error: "샵을 불러오지 못했습니다." }, { status: 503 });
  }
}
```

### 3-2. 쓰기 (Server Actions)

```ts
// src/lib/actions/shops.ts
"use server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const EventInput = z.object({
  shopId: z.string().uuid(),
  title: z.string().trim().min(1).max(150),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  registrationDeadline: z.string().datetime().optional(),
  entryFee: z.coerce.number().int().min(0).default(0),
  format: z.string().trim().min(1).max(60),
  formatNotes: z.string().max(500).optional(),
  capacity: z.coerce.number().int().positive().optional(),
  registrationUrl: z.string().url().optional(),
});

export async function createShopEvent(raw: unknown) {
  const input = EventInput.parse(raw);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  // RLS 가 is_staff() 를 강제하지만, UX 상 미리 안내
  const { data, error } = await supabase.from("shop_events").insert({
    shop_id: input.shopId,
    title: input.title,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    registration_deadline: input.registrationDeadline,
    entry_fee: input.entryFee,
    format: input.format,
    format_notes: input.formatNotes,
    capacity: input.capacity,
    registration_url: input.registrationUrl,
    created_by: user.id,
  }).select("id").single();

  if (error) return { error: "등록에 실패했습니다. 권한을 확인하세요." };
  revalidatePath(`/shops/[slug]`, "page");
  return { id: data.id };
}
```

추가로:
- `submitShop(raw)` — 로그인 사용자 제보(`status: 'pending'`), 레이트리밋(IP/유저당 하루 N건).
- `verifyShop(shopId)` / `setOfficial(shopId, isOfficial, since)` — 스태프 전용.
- `updateEventStatus(eventId, status)` — 취소·접수마감 수동 처리.

---

## 4. Kakao Map 연동

### 4-1. 설정

- Kakao Developers 콘솔에서 **JavaScript 키** 발급 → 플랫폼에 배포 도메인 등록.
- `.env.local`: `NEXT_PUBLIC_KAKAO_MAP_KEY=...` (JS 키는 도메인 제한이 보안 경계).
- SDK 로드: `next/script` 로 `//dapi.kakao.com/v2/maps/sdk.js?appkey=KEY&autoload=false&libraries=services,clusterer`
  → `kakao.maps.load(cb)` 로 초기화.

### 4-2. 좌표 확보 — 렌더 시 지오코딩 금지

- **샵 등록/수정 폼**에서 주소 입력 시 `new kakao.maps.services.Geocoder().addressSearch(addr, cb)` 로
  `lat/lng` + `sido`(`region_1depth_name`) + `sigungu`(`region_2depth_name`) 를 뽑아 DB 에 저장.
- 목록/지도 렌더는 저장된 좌표만 사용 → 지오코딩 쿼터·지연 없음.

### 4-3. 마커 — 공인샵 구분

```
지도 컴포넌트 (client)
 ├─ kakao.maps.Map                     뷰포트 = 선택 시/도 중심 or 전국
 ├─ MarkerClusterer                    줌아웃 시 군집 (전국 수백 개 대비)
 ├─ 일반샵 마커                        기본 핀 (회색/남색), 커스텀 이미지
 ├─ 공인샵 마커                        금색 마커 + 살짝 글로우, z-index 우선
 │                                     └ CustomOverlay 로 배지(✓) 아이콘 얹기
 └─ 마커 click → 리스트 카드와 동기화   (선택 카드 하이라이트 + 스크롤)
```

- **공인샵 강조**: 별도 마커 이미지(`/markers/official.png`) + `MarkerImage` size 크게, 일반은 축소.
  군집 아이콘도 "이 군집에 공인샵 포함" 이면 테두리 색을 바꿔 신호.
- 마커 ↔ 리스트 양방향: `hover` 시 상대편 강조(공유 `selectedShopId` 상태).
- `bounds_changed` (debounce 400ms) → 현재 `map.getBounds()` 를 `bbox` 로 변환해 `/api/shops?bbox=` refetch,
  단 시/도 필터가 걸려 있으면 지도는 그 지역에 고정(뷰포트 refetch 비활성) — UX 혼선 방지.
- 마커 클릭 → 미니 인포윈도우(썸네일·이름·배지·"상세 보기") 또는 리스트로 스크롤.
- SSR 안전: 지도는 `dynamic(() => import("./ShopMap"), { ssr: false })` + 스켈레톤.

### 4-4. 길찾기 / 지도 앱 열기

- `https://map.kakao.com/link/to/{name},{lat},{lng}` (길찾기)
- `https://map.kakao.com/link/map/{name},{lat},{lng}` (지도에서 보기)
- 상세 페이지의 "길찾기" 버튼은 이 링크로.

---

## 5. UI / UX

### 5-1. 네비게이션

`NAV_ITEMS` 에 `{ href: "/shops", label: "카드샵" }` 추가.
`/tournaments`(대형 대회)와 `/shops`(매장·매장대회)는 분리. 필요 시 `/events` 로 매장대회 피드 별도.

### 5-2. `/shops` — 카드샵 탐색 (메인)

```
┌─ PageHeading "카드샵 찾기" ───────────────────────────────────────────┐
│  [시/도 ▾] [시/군/구 ▾]  [ 공인샵만 ◻︎ ]   🔍 [ 매장명 검색        ]   │
│  선택된 필터 칩:  서울 ✕   강남구 ✕   공인샵 ✕        (전체 초기화)     │
├──────────────────────────────┬────────────────────────────────────────┤
│  ShopList (좌, ~40%, 스크롤)  │  ShopMap (우, sticky, ~60%)            │
│  ┌────────────────────────┐  │   ● 공인샵(금)  ○ 일반샵               │
│  │ [사진] 카드캐슬 강남     │  │   군집: (12)                          │
│  │  🛡 공인샵               │  │                                      │
│  │  서울 강남구 · ☎ …      │  │   [지도에서 이 영역 다시 검색] 버튼    │
│  │  이번 주 대회 2건 ›     │  │                                      │
│  └────────────────────────┘  │                                      │
│  … 카드 반복 …               │                                      │
└──────────────────────────────┴────────────────────────────────────────┘
모바일: 상단 [ 목록 | 지도 ] 토글. 지도 뷰에서 하단 시트로 카드 미리보기.
```

- **URL 상태**: `/shops?sido=서울&sigungu=강남구&official=1&q=...` — SSR 필터, 공유 가능.
  `RegionSelect` 변경 → `router.push` (스크롤 유지). 카드 검색은 디바운스.
- **정렬**: 공인샵 우선 → 이름순. (위치 권한 허용 시 "가까운 순" 옵션 = 클라이언트에서 거리 계산.)
- 리스트/지도 **양방향 하이라이트** (`selectedShopId` 를 페이지 레벨 상태로).
- 빈 상태: "이 지역에 등록된 카드샵이 없어요 — 제보하기" CTA.

### 5-3. 공인샵 강조 UI

| 위치 | 표현 |
|---|---|
| 배지 컴포넌트 `<OfficialBadge>` | 금색 pill + 방패/체크 아이콘. `official_since` 를 title 로. `size: sm/md` |
| 리스트 카드 | 이름 옆 배지 + 카드 좌측에 금색 3px 라인 |
| 상세 헤더 | 큰 배지 + "리프트바운드 공인 매장" 라벨 + 지정일 |
| 지도 마커 | 금색 커스텀 마커 + 은은한 그림자/글로우, 일반 마커보다 크게, z-index 위 |
| 필터 | "공인샵만" 토글을 필터바에서 눈에 띄게 |
| (없을 때) | 아직 공인샵 제도 전이면 배지·필터를 숨기고 `is_official` 컬럼만 유지 → 지정 시작 시 노출 |

```tsx
// src/components/shops/official-badge.tsx
export function OfficialBadge({ since, size = "md" }: { since?: string | null; size?: "sm" | "md" }) {
  return (
    <span
      title={since ? `공인 지정 ${since}` : "리프트바운드 공인 매장"}
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-amber/15 font-bold text-amber-strong",
        size === "sm" ? "px-1.5 py-0.5 text-label-sm" : "px-2 py-0.5 text-label-md",
      )}
    >
      <ShieldCheck className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      공인샵
    </span>
  );
}
```

### 5-4. `/shops/[slug]` — 매장 상세

```
← 카드샵 목록
┌────────────────────────────────────────────────────────────┐
│  [ 커버 사진 ]                                              │
│  카드캐슬 강남   🛡 공인샵                                   │
│  서울 강남구 테헤란로 … 3F   [지도]  [길찾기]                │
│  ☎ 02-1234-5678   ·  @instagram  ·  네이버 플레이스          │
├──────────────┬─────────────────────────────────────────────┤
│  영업시간     │  [ 미니 지도 - 단일 마커 ]                   │
│  월 13–22 …   │                                             │
│  오늘 · 영업중 │                                             │
├──────────────┴─────────────────────────────────────────────┤
│  [ 개요 ]  [ 대회 일정 (3) ]        ← 탭. 예정 이벤트 있으면 대회 탭 기본  │
│                                                            │
│  대회 일정 탭:                                              │
│   ┌──────────────────────────────────────────────┐         │
│   │ 🟢 접수 중   주간 스탠다드 #12                 │         │
│   │ 3/15(토) 14:00 · 참가비 5,000원 · Standard    │         │
│   │ 정원 [■■■■■□□□] 20/32                          │         │
│   │ [ 신청하기 ↗ ]   [ 상세 ]                      │         │
│   └──────────────────────────────────────────────┘         │
│   … 예정 이벤트 …                                            │
│   ▸ 지난 대회 (접기)                                         │
└────────────────────────────────────────────────────────────┘
```

- `<BusinessHours>` — jsonb 파싱, 오늘 행 강조, 현재시각 기준 "영업 중 / 영업 종료 / 곧 마감".
- 대회 탭: `effective_status` 로 칩 색상(접수중=초록, 접수마감=주황, 진행중=파랑, 종료=회색, 취소=빨강 취소선).
- `<CapacityBar>` — `registered_count / capacity` 진행바. capacity 없으면 "정원 제한 없음".
- 이벤트 상세는 별도 페이지 없이 카드 확장(Disclosure) 또는 `/shops/[slug]/events/[id]` 얕은 라우트.

### 5-5. (선택) `/events` — 전국 매장대회 피드

- 상단 [시/도 ▾] [이번 주 / 이번 달 / 포맷 ▾]
- 날짜 그룹 리스트 (오늘 / 내일 / 이번 주말 …), 각 항목에 매장명·배지·지역.
- 캘린더 뷰는 v2.

### 5-6. 제보 / 등록 폼

- `<ShopSubmitForm>` (로그인 필요): 매장명·주소(Kakao 주소검색 위젯)·연락처·사진 → `status:'pending'`.
  제출 후 "검수 후 등록됩니다" 안내. 스태프는 `/admin/shops` 큐에서 승인.
- `<EventForm>` (스태프/매니저): 매장 선택·제목·일시·참가비·포맷·정원.
- `<ShopForm>` (스태프): 전체 필드 + `is_official` 토글 + 좌표 확인 지도.

### 5-7. 컴포넌트 트리

```
src/components/shops/
  region-select.tsx        시/도 + 시/군/구 종속 select (client)
  shop-filters.tsx         필터바, URL 동기화 (client)
  shop-list.tsx            결과 리스트 + 페이지네이션
  shop-card.tsx            사진·이름·배지·지역·"대회 N건"
  shop-map.tsx             Kakao 지도 (client, ssr:false)
    shop-marker.tsx        일반/공인 마커 팩토리
    map-refetch-button.tsx "이 영역 다시 검색"
  official-badge.tsx
  business-hours.tsx
  shop-header.tsx
  events/
    event-list.tsx
    event-card.tsx
    event-status-chip.tsx
    capacity-bar.tsx
    event-form.tsx         (staff)
  shop-submit-form.tsx     (community)

src/lib/
  shops.ts                 조회 (server-only)
  actions/shops.ts         createShopEvent / submitShop / verifyShop …
  data/kr-sigungu.ts       시/도별 시/군/구 목록
  kakao.ts                 SDK 로더 훅 useKakaoLoader(), 지오코딩 헬퍼
```

### 5-8. 상태·데이터 흐름

```
/shops (Server Component)
  ├─ searchParams → searchShops()  ── SSR 초기 리스트 + 마커 좌표
  ├─ <ShopFilters>  (client)       ── select/toggle → router.push(?sido=…)
  ├─ <ShopList shops={initial}>    ── selectedShopId 는 부모 상태
  └─ <ShopMap shops={initial}>     ── bounds 이동 → fetch("/api/shops?bbox=") → 마커만 교체
                                       (시/도 필터 활성 시 뷰포트 refetch off)
/shops/[slug] (Server Component)
  └─ getShop(slug) → shop + shop_events_public  ── 탭 UI 는 client
```

---

## 6. 마이그레이션 / 도입 순서

1. `schema.sql` 에 enum 2개 + `shops`, `shop_events` + 인덱스/트리거 + `shop_events_public` 뷰 추가.
2. `policies.sql` 에 RLS 정책 추가. `supabase db push`.
3. `KR_SIDO` 상수 + `kr-sigungu.ts` 데이터 파일. (행정안전부 행정구역 목록에서 생성)
4. `src/lib/shops.ts` + `/api/shops` Route Handler + `/shops` 페이지(필터·리스트, 지도는 스텁).
5. Kakao JS 키 발급 → `NEXT_PUBLIC_KAKAO_MAP_KEY` → `<ShopMap>` 구현 (마커·군집·bbox refetch).
6. `/shops/[slug]` 상세 + `<BusinessHours>` + 대회 탭(읽기).
7. Server Actions: `submitShop`(커뮤니티) → `/admin/shops` 승인 큐 → `createShopEvent`(스태프).
8. 시드: 주요 도시 카드샵 수동 등록(공인 제도 시작 시 `is_official` 지정). 커뮤니티 제보 오픈.
9. (v2) `shop_event_registrations` 사이트 내 신청, `shop_managers` 매장주 권한, `/events` 피드, 캘린더.

## 7. 열린 결정 사항

- **시/군/구 데이터 소스**: 정적 파일로 고정 vs 행정구역 개편 대응(드묾) → 정적 + 연 1회 점검 권장.
- **참가 신청**: 외부 링크(디스코드/구글폼)만 vs 사이트 내 신청(로그인·대기자·알림 필요) → v1 링크, v2 내장.
- **매장주 셀프서비스**: v1 스태프 대행 vs `shop_managers` 초대 흐름 → 등록 매장 수가 늘면 v2.
- **`tournaments` 통합**: 지금은 분리. `/events` 허브에서 `tournaments` + `shop_events` 를 한 피드로 합칠지.
- **지도 성능**: 전국 마커 수가 수천을 넘으면 서버측 클러스터링(격자 집계 API) 고려.
