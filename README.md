# 리바지지 (RIBA.GG)

리프트바운드(Riftbound) TCG 정보 허브 — 티어리스트 · 카드 DB · 덱 시뮬레이터 · 시세 · 커뮤니티. (`riba.gg`)

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS — "Tactile Neo-Arcade" 디자인 시스템 (`DESIGN.md`)
- **BaaS**: Supabase (Postgres + Auth + Storage), Row Level Security 기반

---

## 1. 폴더 구조

```
rift-report/
├── src/
│   ├── app/                          # App Router
│   │   ├── layout.tsx                # 루트 레이아웃 (폰트, Navbar, Footer)
│   │   ├── globals.css               # 디자인 토큰(CSS 변수) + 컴포넌트 클래스
│   │   ├── page.tsx                  # ★ 메인 대시보드
│   │   ├── not-found.tsx
│   │   │
│   │   ├── reports/                  # 리포트(뉴스·분석)
│   │   │   ├── page.tsx              #   목록
│   │   │   └── [slug]/page.tsx       #   상세
│   │   │
│   │   ├── tiers/                    # 덱 티어리스트
│   │   │   ├── page.tsx              #   S/A/B/C 티어 보드
│   │   │   └── [slug]/page.tsx       #   덱 상세 + 덱리스트
│   │   │
│   │   ├── cards/                    # 카드 DB
│   │   │   ├── page.tsx              #   검색 + 필터 + 그리드
│   │   │   └── [id]/page.tsx         #   카드 상세 (모달은 인터셉트 라우트로 확장)
│   │   │
│   │   ├── rules/                    # 룰 & 용어
│   │   │   └── page.tsx              #   초보자 가이드 + 용어 검색
│   │   │
│   │   ├── community/                # 커뮤니티 게시판
│   │   │   ├── page.tsx              #   카테고리 허브
│   │   │   ├── [category]/page.tsx   #   자유 / 공략·팁 / 덱 분석 목록
│   │   │   ├── post/[id]/page.tsx    #   게시글 + 댓글
│   │   │   └── new/page.tsx          #   글쓰기 (로그인 가드)
│   │   │
│   │   ├── trading/                  # 카드 거래 게시판
│   │   │   ├── page.tsx              #   팝니다/삽니다/교환 목록
│   │   │   ├── [id]/page.tsx         #   거래글 상세
│   │   │   └── new/page.tsx          #   거래글 등록 (로그인 가드)
│   │   │
│   │   ├── tournaments/              # 대회 정보
│   │   │   ├── page.tsx              #   상태별 카드 뷰
│   │   │   └── [slug]/page.tsx       #   대회 상세
│   │   │
│   │   ├── login/page.tsx            # 매직 링크 + OAuth
│   │   ├── auth/callback/route.ts    # 세션 교환 (오픈 리다이렉트 차단)
│   │   └── me/page.tsx               # 내 프로필 (로그인 가드)
│   │
│   ├── components/
│   │   ├── layout/                   # navbar, footer
│   │   ├── home/                     # 대시보드 섹션 (report-highlights, tier-summary, ...)
│   │   ├── auth/                     # login-form, sign-out-button
│   │   └── ui/                       # section-header, tier-badge, page-heading (공용 프리미티브)
│   │
│   └── lib/
│       ├── constants.ts             # 네비, 카테고리, 티어 스타일, 카드 도메인/타입/레어도
│       ├── utils.ts                 # cn(), formatKRW()
│       ├── queries.ts               # 홈 대시보드용 서버 읽기 쿼리 (server-only)
│       ├── supabase/
│       │   ├── client.ts            # 브라우저 클라이언트
│       │   ├── server.ts            # 서버 컴포넌트/액션 클라이언트
│       │   └── middleware.ts        # 세션 쿠키 갱신
│       └── types/database.ts        # 스키마 타입 (supabase gen types 로 대체 가능)
│
├── middleware.ts                    # updateSession 연결
├── supabase/
│   ├── schema.sql                   # 테이블 · 인덱스 · 트리거 · ENUM
│   ├── policies.sql                 # RLS 정책 + Storage 정책 가이드
│   └── seed.sql                     # 개발용 시드
├── tailwind.config.ts              # 디자인 토큰 → Tailwind 매핑
├── .env.local.example
└── DESIGN.md                        # 디자인 시스템 스펙
```

> **확장 포인트**
> - 카드 상세 모달: `app/cards/@modal/(.)[id]/page.tsx` 인터셉트 라우트
> - 관리자: `app/(admin)/` 라우트 그룹 + `is_staff()` 가드
> - i18n: `next-intl` 도입 시 `app/[locale]/` 로 이동

---

## 2. 시작하기

```bash
npm install
cp .env.local.example .env.local   # Supabase 키 입력
```

### Supabase 설정

1. [supabase.com](https://supabase.com) 프로젝트 생성 → `Project Settings > API` 에서 URL / anon key 복사
2. `SQL Editor` 에서 순서대로 실행: `supabase/schema.sql` → `supabase/policies.sql` (→ 선택: `seed.sql`)
3. `Authentication > Providers` 에서 Email(매직 링크) 활성화, 필요 시 Google OAuth 설정
4. `Authentication > URL Configuration` 의 Redirect URLs 에 `http://localhost:3000/auth/callback` 추가
5. `Storage` 에서 버킷 생성: `avatars`, `trade-images`, `report-covers`, `card-images` (모두 public read) — 업로드 정책은 `policies.sql` 하단 참고

```bash
npm run dev        # http://localhost:3000
npm run typecheck  # 타입 점검
```

DB 미연결 상태에서도 홈은 빈 상태(Empty State)로 정상 렌더된다 (`lib/queries.ts` 의 `safe()` 폴백).

---

## 3. 데이터베이스 스키마

전체 DDL은 [`supabase/schema.sql`](supabase/schema.sql), 권한은 [`supabase/policies.sql`](supabase/policies.sql).

### 테이블 개요

| 테이블 | 용도 | 주요 컬럼 | 쓰기 권한 (RLS) |
|---|---|---|---|
| `profiles` | `auth.users` 1:1 확장 | `username`, `avatar_url`, `role(user\|editor\|admin)` | 본인만 update, 가입 시 트리거로 자동 생성 |
| `reports` | 뉴스·분석 글 | `slug`, `title`, `body`, `status(draft\|published)`, `tag`, `view_count` | editor·admin |
| `cards` | 카드 DB | `code`, `name`, `domains[]`, `type`, `cost`, `might`, `rarity`, `search_tsv` | editor·admin |
| `decks` | 티어리스트 덱 | `slug`, `tier(S\|A\|B\|C)`, `tier_rank`, `archetype`, `champion_card_ids[]`, `guide` | editor·admin |
| `deck_cards` | 덱 ↔ 카드 (수량) | `(deck_id, card_id, board)` PK, `quantity`, `board(main\|rune\|sideboard)` | editor·admin |
| `glossary_terms` | 룰 & 용어 | `term`, `reading`, `category`, `definition`, `related_terms[]`, `search_tsv` | editor·admin |
| `posts` | 커뮤니티 게시글 | `category(free\|guide\|deck-analysis)`, `title`, `body`, `author_id`, `deck_id?`, `view/like/comment_count` | 작성: 로그인, 수정·삭제: 본인 or staff |
| `comments` | 댓글 (대댓글) | `post_id`, `parent_id?`, `body`, `author_id` | 작성: 로그인, 수정·삭제: 본인 |
| `post_likes` | 좋아요 | `(post_id, user_id)` PK | 본인만 |
| `trade_listings` | 카드 거래 | `category(sell\|buy\|trade)`, `card_id?`, `card_condition`, `price?`, `status(open\|reserved\|closed)`, `region`, `images[]`, `seller_id` | 작성: 로그인, 수정·삭제: 본인 |
| `tournaments` | 대회 | `slug`, `name`, `status(upcoming\|ongoing\|finished)`, `starts_at`, `format`, `location`, `is_online`, `registration_url`, `prize_pool` | editor·admin |

### 관계 요약

```
auth.users ─1:1─ profiles ─1:N─ posts ─1:N─ comments
                     │            └─1:N─ post_likes
                     ├─1:N─ trade_listings ─N:1─ cards
                     └─1:N─ reports (author)

decks ─N:M─ cards            (deck_cards 조인 테이블: quantity, board)
decks.champion_card_ids[]    → cards.id (대표 챔피언 아이콘, 배열 참조)
posts.deck_id (nullable)     → decks.id ('덱 분석' 카테고리)
```

### 카운터 동기화 (트리거)

- `comments` insert/delete → `posts.comment_count`
- `post_likes` insert/delete → `posts.like_count`
- `updated_at` 은 모든 갱신 대상 테이블에 `set_updated_at()` 트리거
- 조회수는 `increment_view_count('reports'|'posts', id)` RPC 로 원자적 증가

### 검색

- 카드/용어: `tsvector` 생성 컬럼 + GIN 인덱스 (`to_tsvector`), 부분 일치는 `pg_trgm`
- 카드 필터: `(type, cost, rarity)` 복합 인덱스 + `domains` GIN

---

## 4. 보안 원칙

- **클라이언트는 anon 키만 사용.** `service_role` 키는 `.env.local` 서버 전용, 시드/관리 스크립트에서만.
- **모든 테이블 RLS 활성화.** 서버 코드도 사용자 세션으로 쿼리하므로 정책이 항상 적용된다.
- 권한 판정은 DB 함수 `is_staff()` (security definer) 한 곳에서.
- OAuth 콜백은 `next` 파라미터를 내부 절대경로로만 제한 (오픈 리다이렉트 차단).
- 글쓰기/거래 등록 페이지는 서버에서 `getUser()` 로 1차 가드 후, 최종 방어선은 RLS.
- 사용자 입력 길이 제한은 스키마 `CHECK` 제약으로 강제.
- Storage 업로드는 `trade-images/{uid}/...` 처럼 본인 폴더 경로만 허용.
