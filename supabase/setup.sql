-- ============================================================================
--  Rift Report — 전체 셋업 (스키마 + RLS 정책 + 샘플 데이터)
--  Supabase Dashboard → SQL Editor → 새 쿼리에 전체 붙여넣고 Run 한 번.
--  성공 시 'Success. No rows returned' 또는 'Rows returned' 표시.
-- ============================================================================

-- ▼▼▼ 1) 스키마 ▼▼▼
-- ============================================================================
--  Rift Report — Supabase / PostgreSQL 스키마
--  실행: Supabase Dashboard > SQL Editor 또는 `supabase db push`
--  RLS 정책은 policies.sql 에 분리
-- ============================================================================

create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "pg_trgm";        -- 부분 문자열 검색

-- ─────────────────────────── ENUM 타입 ──────────────────────────────────────
create type user_role           as enum ('user', 'editor', 'admin');
create type report_status       as enum ('draft', 'published');
create type tier                as enum ('S', 'A', 'B', 'C');
create type deck_board          as enum ('main', 'rune', 'sideboard');
create type community_category  as enum ('riftbound', 'report', 'deck-guide', 'tournament', 'recruit');
create type trading_category    as enum ('sell', 'buy', 'trade');
create type trade_status        as enum ('open', 'reserved', 'closed');
create type tournament_status   as enum ('upcoming', 'ongoing', 'finished');

-- ─────────────────────────── 공통: updated_at 트리거 ────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ============================================================================
--  1. profiles  — auth.users 1:1 확장
-- ============================================================================
create table profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text not null unique check (char_length(username) between 2 and 20),
  avatar_url  text,
  bio         text check (char_length(bio) <= 300),
  role        user_role not null default 'user',
  created_at  timestamptz not null default now()
);

-- 회원가입 시 자동으로 프로필 생성
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'user_name',
      split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4)
    )
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================================
--  2. reports  — 뉴스 / 분석 글 (에디터 작성)
-- ============================================================================
create table reports (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  excerpt         text,
  body            text not null,                 -- MDX 또는 rich text
  cover_image_url text,
  tag             text,                          -- '메타분석', '패치노트' 등
  status          report_status not null default 'draft',
  author_id       uuid references profiles (id) on delete set null,
  published_at    timestamptz,
  view_count      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index reports_published_idx on reports (published_at desc) where status = 'published';
create trigger reports_updated before update on reports for each row execute function set_updated_at();

-- ============================================================================
--  3. cards  — 카드 DB (관리자 시드 / 임포트)
-- ============================================================================
create table cards (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,              -- 예: 'OGN-001'
  name        text not null,
  name_en     text,
  set_code    text not null,                     -- 'OGN' 등
  rarity      text not null,                     -- common | uncommon | rare | epic | overnumbered
  domains     text[] not null default '{}',      -- ['fury','calm']
  type        text not null,                     -- champion | unit | spell | gear | rune | battlefield | legend
  subtypes    text[] not null default '{}',
  cost        integer,
  might       integer,
  text        text,
  flavor      text,
  image_url   text,
  artist      text,
  search_tsv  tsvector generated always as (
                to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(name_en,'') || ' ' || coalesce(text,''))
              ) stored,
  created_at  timestamptz not null default now()
);
create index cards_search_idx  on cards using gin (search_tsv);
create index cards_name_trgm    on cards using gin (name gin_trgm_ops);
create index cards_domains_idx  on cards using gin (domains);
create index cards_filter_idx   on cards (type, cost, rarity);

-- ============================================================================
--  4. decks + deck_cards  — 티어리스트
-- ============================================================================
create table decks (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  name              text not null,
  archetype         text,                        -- 'Aggro', 'Control' 등
  tier              tier not null,
  tier_rank         integer not null default 0,  -- 같은 티어 내 정렬 순서
  summary           text,
  guide             text,                        -- 상세 공략 (MDX)
  champion_card_ids uuid[] not null default '{}',-- 대표 챔피언 아이콘용 (cards.id)
  author_id         uuid references profiles (id) on delete set null,
  is_featured       boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index decks_tier_idx on decks (tier, tier_rank);
create trigger decks_updated before update on decks for each row execute function set_updated_at();

create table deck_cards (
  deck_id   uuid not null references decks (id) on delete cascade,
  card_id   uuid not null references cards (id) on delete restrict,
  quantity  integer not null default 1 check (quantity between 1 and 40),
  board     deck_board not null default 'main',
  primary key (deck_id, card_id, board)
);

-- ============================================================================
--  5. glossary_terms  — 룰 & 용어
-- ============================================================================
-- name_en = 공식 영문 canonical(안정). term = 표시용 한글명(is_official=false 면 임시 번역).
-- Riot API 도입 시 term/is_official 을 일괄 업데이트한다(name_en 은 매칭 키).
create table glossary_terms (
  id              uuid primary key default gen_random_uuid(),
  name_en         text not null unique,            -- 공식 영문명 (매칭/링크 키)
  term            text not null,                   -- 표시용 한글명 (임시 가능)
  is_official     boolean not null default false,  -- 한글명 공식 확정 여부
  symbol          text,                            -- 카드 기호 예: '[M]'
  category        text,                            -- '전투', '자원', '키워드' 등
  definition      text not null,
  related_terms   text[] not null default '{}',    -- name_en 값들
  card_searchable boolean not null default false,  -- 카드 텍스트에 등장 → 카드 검색 연동
  search_tsv      tsvector generated always as (
                    to_tsvector('simple',
                      coalesce(term,'') || ' ' || coalesce(name_en,'') || ' ' ||
                      coalesce(symbol,'') || ' ' || coalesce(definition,''))
                  ) stored,
  created_at      timestamptz not null default now()
);
create index glossary_search_idx on glossary_terms using gin (search_tsv);
create index glossary_term_trgm  on glossary_terms using gin (term gin_trgm_ops);
create index glossary_en_trgm    on glossary_terms using gin (name_en gin_trgm_ops);

-- ============================================================================
--  6. posts + comments  — 커뮤니티 게시판
-- ============================================================================
create table posts (
  id            uuid primary key default gen_random_uuid(),
  category      community_category not null,
  title         text not null check (char_length(title) between 2 and 150),
  body          text not null,
  author_id     uuid not null references profiles (id) on delete cascade,
  deck_id       uuid references decks (id) on delete set null,   -- 덱 공략용
  view_count    integer not null default 0,
  like_count    integer not null default 0,
  comment_count integer not null default 0,
  is_notice     boolean not null default false,   -- 관리자 공지 (다른 색상 표시)
  is_pinned     boolean not null default false,   -- 상단 고정(비공지)
  search_tsv    tsvector generated always as (
                  to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(body,''))
                ) stored,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index posts_list_idx    on posts (category, is_notice desc, is_pinned desc, created_at desc);
create index posts_popular_idx on posts (like_count desc, created_at desc);
create index posts_recent_idx  on posts (created_at desc);
create index posts_search_idx  on posts using gin (search_tsv);
create index posts_title_trgm  on posts using gin (title gin_trgm_ops);
create trigger posts_updated before update on posts for each row execute function set_updated_at();

create table comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references posts (id) on delete cascade,
  parent_id  uuid references comments (id) on delete cascade,     -- 대댓글
  body       text not null check (char_length(body) between 1 and 2000),
  author_id  uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index comments_post_idx on comments (post_id, created_at);

-- posts.comment_count 동기화
create or replace function sync_comment_count()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    update posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif (tg_op = 'DELETE') then
    update posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end $$;
create trigger comments_count_sync
  after insert or delete on comments
  for each row execute function sync_comment_count();

-- 좋아요 (중복 방지)
create table post_likes (
  post_id    uuid not null references posts (id) on delete cascade,
  user_id    uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create or replace function sync_like_count()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    update posts set like_count = like_count + 1 where id = new.post_id;
  else
    update posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end $$;
create trigger post_likes_count_sync
  after insert or delete on post_likes
  for each row execute function sync_like_count();

-- ============================================================================
--  7. trade_listings  — 카드 거래 게시판
-- ============================================================================
create table trade_listings (
  id             uuid primary key default gen_random_uuid(),
  category       trading_category not null,
  title          text not null check (char_length(title) between 2 and 150),
  description    text,
  card_id        uuid references cards (id) on delete set null,
  card_condition text,                           -- mint | near-mint | lightly-played | played | damaged
  price          integer check (price is null or price >= 0),   -- KRW, null = 협의/교환
  is_negotiable  boolean not null default false,
  status         trade_status not null default 'open',
  region         text,                           -- '서울', '온라인' 등
  images         text[] not null default '{}',   -- Storage 경로
  seller_id      uuid not null references profiles (id) on delete cascade,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index trades_list_idx on trade_listings (status, category, created_at desc);
create index trades_card_idx  on trade_listings (card_id) where card_id is not null;
create trigger trades_updated before update on trade_listings for each row execute function set_updated_at();

-- ============================================================================
--  8. tournaments  — 대회 정보
-- ============================================================================
create table tournaments (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  name             text not null,
  description      text,
  format           text,                         -- 'Swiss + Top8' 등
  status           tournament_status not null default 'upcoming',
  starts_at        timestamptz not null,
  ends_at          timestamptz,
  location         text,
  is_online        boolean not null default false,
  organizer        text,
  registration_url text,
  prize_pool       text,
  banner_url       text,
  created_at       timestamptz not null default now()
);
create index tournaments_schedule_idx on tournaments (status, starts_at);

-- 조회수 원자적 증가 (레이스 컨디션 방지). reports/posts 공용
create or replace function increment_view_count(table_name text, row_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if table_name not in ('reports', 'posts') then
    raise exception 'invalid table';
  end if;
  execute format('update %I set view_count = view_count + 1 where id = $1', table_name) using row_id;
end $$;

-- ============================================================================
--  9. card_prints + price_snapshots  — 시세 (JustTCG 미러)
--     card_prints  = 언어·일러스트·레어도별 프린트 1행
--     price_snapshots = 프린트별 시세 스냅샷 (6시간마다 GitHub Actions 로 누적)
-- ============================================================================
create table card_prints (
  id                 uuid primary key default gen_random_uuid(),
  card_id            uuid references cards (id) on delete set null,  -- 카드 DB 연동 시
  group_id           text not null,                 -- 같은 카드(이름) 묶음 키 — 다른 언어/일러스트 그룹핑
  name               text not null,
  name_en            text,
  set_code           text,
  number             text,                          -- 수집 번호 (alt-art 는 '123a' 식)
  rarity             text,
  art_variant        text,                          -- 일러스트 구분 (없으면 null)
  language           text not null default 'en',    -- en | ja | zh | ko ...
  finish             text not null default 'normal',-- normal | foil
  image_url          text,
  justtcg_card_id    text unique,                   -- 시세 매칭 키
  tcgplayer_url      text,                          -- "거래 사이트로 이동" 링크
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index card_prints_group_idx on card_prints (group_id);
create index card_prints_card_idx  on card_prints (card_id) where card_id is not null;
create index card_prints_name_trgm on card_prints using gin (name gin_trgm_ops);
create trigger card_prints_updated before update on card_prints for each row execute function set_updated_at();

-- JustTCG 는 단일 블렌디드 시세(price)만 제공한다. 별도 매수/매도 호가는 없음.
-- market_price = 시세(체결가 대용). 변형별(condition·printing) 로 여러 행.
-- is_headline = 프린트 대표 시세(NM·Normal 우선) — Top5/목록에서 이 행만 사용.
create table price_snapshots (
  id             uuid primary key default gen_random_uuid(),
  print_id       uuid not null references card_prints (id) on delete cascade,
  captured_at    timestamptz not null default now(),
  is_current     boolean not null default true,
  is_headline    boolean not null default false,
  condition      text not null default 'NM',      -- NM | LP | MP | HP | DM
  printing       text not null default 'normal',  -- normal | foil
  market_price   numeric(12,2),
  change_24h     numeric(7,2),                    -- %
  change_7d      numeric(7,2),                    -- % — 급등 Top5 기준
  change_30d     numeric(7,2),                    -- %
  change_90d     numeric(7,2),                    -- %
  avg_price_30d  numeric(12,2),
  min_price_90d  numeric(12,2),
  max_price_90d  numeric(12,2),
  history        jsonb not null default '[]',     -- [{t: unix, p: price}] — 스파크라인용 (JustTCG 제공 구간)
  currency       text not null default 'USD',
  tcgplayer_sku  text                             -- 변형별 딥링크용
);
create index price_current_mover_idx on price_snapshots (change_7d desc) where is_current and is_headline;
create index price_current_idx       on price_snapshots (print_id) where is_current;
create index price_history_idx       on price_snapshots (print_id, captured_at desc);

-- ▼▼▼ 2) RLS 정책 ▼▼▼
-- ============================================================================
--  Rift Report — Row Level Security 정책
--  원칙:
--   1. 공개 읽기 콘텐츠(카드/티어/용어/발행 리포트/대회)는 anon 도 SELECT 허용
--   2. 사용자 생성 콘텐츠는 "본인만 수정/삭제", 작성은 "로그인 + author = auth.uid()"
--   3. 관리 콘텐츠(reports/cards/decks/tournaments/glossary)는 editor·admin 만 쓰기
--   4. 클라이언트는 anon 키만 사용 → service_role 키는 서버 시드 스크립트 전용
-- ============================================================================

-- 역할 확인 헬퍼
create or replace function is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('editor', 'admin')
  );
$$;

-- 모든 테이블 RLS 활성화
alter table profiles       enable row level security;
alter table reports        enable row level security;
alter table cards          enable row level security;
alter table decks          enable row level security;
alter table deck_cards     enable row level security;
alter table glossary_terms enable row level security;
alter table posts          enable row level security;
alter table comments       enable row level security;
alter table post_likes     enable row level security;
alter table trade_listings enable row level security;
alter table tournaments    enable row level security;
alter table card_prints     enable row level security;
alter table price_snapshots enable row level security;

-- ─────────────────────────── profiles ──────────────────────────────────────
create policy "프로필 공개 읽기"      on profiles for select using (true);
create policy "본인 프로필 수정"      on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
-- INSERT 는 handle_new_user 트리거(security definer)가 담당 → 정책 불필요

-- ─────────────────────────── reports ───────────────────────────────────────
create policy "발행 리포트 읽기"      on reports for select
  using (status = 'published' or is_staff());
create policy "스태프 리포트 작성"    on reports for insert with check (is_staff());
create policy "스태프 리포트 수정"    on reports for update using (is_staff());
create policy "스태프 리포트 삭제"    on reports for delete using (is_staff());

-- ─────────────────────────── cards / decks / deck_cards / glossary ─────────
create policy "카드 공개 읽기"        on cards for select using (true);
create policy "스태프 카드 쓰기"      on cards for all using (is_staff()) with check (is_staff());

create policy "덱 공개 읽기"          on decks for select using (true);
create policy "스태프 덱 쓰기"        on decks for all using (is_staff()) with check (is_staff());

create policy "덱카드 공개 읽기"      on deck_cards for select using (true);
create policy "스태프 덱카드 쓰기"    on deck_cards for all using (is_staff()) with check (is_staff());

create policy "용어 공개 읽기"        on glossary_terms for select using (true);
create policy "스태프 용어 쓰기"      on glossary_terms for all using (is_staff()) with check (is_staff());

-- ─────────────────────────── posts ─────────────────────────────────────────
-- 공지(is_notice=true)는 스태프만 작성/수정 가능. 일반 글은 본인만.
create policy "게시글 공개 읽기"      on posts for select using (true);
create policy "로그인 게시글 작성"    on posts for insert
  with check (
    auth.uid() = author_id
    and (is_notice = false or is_staff())
    and (is_pinned = false or is_staff())
  );
create policy "본인 게시글 수정"      on posts for update
  using (auth.uid() = author_id or is_staff())
  with check (
    (auth.uid() = author_id or is_staff())
    and (is_notice = false or is_staff())
    and (is_pinned = false or is_staff())
  );
create policy "본인 게시글 삭제"      on posts for delete
  using (auth.uid() = author_id or is_staff());

-- ─────────────────────────── comments ──────────────────────────────────────
create policy "댓글 공개 읽기"        on comments for select using (true);
create policy "로그인 댓글 작성"      on comments for insert
  with check (auth.uid() = author_id);
create policy "본인 댓글 수정"        on comments for update
  using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "본인 댓글 삭제"        on comments for delete
  using (auth.uid() = author_id or is_staff());

-- ─────────────────────────── post_likes ────────────────────────────────────
create policy "좋아요 읽기"           on post_likes for select using (true);
create policy "본인 좋아요 추가"      on post_likes for insert with check (auth.uid() = user_id);
create policy "본인 좋아요 취소"      on post_likes for delete using (auth.uid() = user_id);

-- ─────────────────────────── trade_listings ────────────────────────────────
create policy "거래글 공개 읽기"      on trade_listings for select using (true);
create policy "로그인 거래글 작성"    on trade_listings for insert
  with check (auth.uid() = seller_id);
create policy "본인 거래글 수정"      on trade_listings for update
  using (auth.uid() = seller_id) with check (auth.uid() = seller_id);
create policy "본인 거래글 삭제"      on trade_listings for delete
  using (auth.uid() = seller_id or is_staff());

-- ─────────────────────────── tournaments ───────────────────────────────────
create policy "대회 공개 읽기"        on tournaments for select using (true);
create policy "스태프 대회 쓰기"      on tournaments for all using (is_staff()) with check (is_staff());

-- ─────────────────────────── card_prints / price_snapshots ─────────────────
-- 시세 동기화는 service_role 키로 실행되어 RLS 를 우회한다. 읽기는 전체 공개.
create policy "프린트 공개 읽기"      on card_prints for select using (true);
create policy "스태프 프린트 쓰기"    on card_prints for all using (is_staff()) with check (is_staff());
create policy "시세 공개 읽기"        on price_snapshots for select using (true);
create policy "스태프 시세 쓰기"      on price_snapshots for all using (is_staff()) with check (is_staff());

-- ============================================================================
--  Storage 버킷 정책 (Dashboard 에서 버킷 생성 후 적용)
--   - avatars        : public read,  본인 폴더에만 write   (avatars/{uid}/...)
--   - trade-images   : public read,  본인 폴더에만 write   (trade-images/{uid}/...)
--   - report-covers  : public read,  staff 만 write
--   - card-images    : public read,  staff 만 write
-- ============================================================================
-- 예시: trade-images 업로드 정책
-- create policy "본인 폴더 거래 이미지 업로드"
--   on storage.objects for insert to authenticated
--   with check (
--     bucket_id = 'trade-images'
--     and (storage.foldername(name))[1] = auth.uid()::text
--   );

-- ▼▼▼ 3) 샘플 데이터 (선택) ▼▼▼
-- ============================================================================
--  개발용 시드 데이터 (선택). `supabase db reset` 시 자동 실행.
--  주의: auth.users 가 없으므로 author_id 는 NULL 로 둔다.
-- ============================================================================

insert into cards (code, name, name_en, set_code, rarity, domains, type, cost, might, text) values
  ('OGN-001', '아리', 'Ahri', 'OGN', 'epic',    array['mind'],        'champion', 3, 3, '소환 시: 카드 1장을 뽑는다.'),
  ('OGN-014', '가렌', 'Garen', 'OGN', 'rare',   array['body','order'],'champion', 4, 5, '방어도 2.'),
  ('OGN-032', '점화', 'Ignite', 'OGN', 'common',array['fury'],        'spell',    1, null,'유닛에게 피해 2.')
on conflict (code) do nothing;

insert into decks (slug, name, archetype, tier, tier_rank, summary, champion_card_ids) values
  ('ahri-tempo',  '아리 템포',   'Tempo',   'S', 0, '유연한 카드 어드밴티지 기반 중속 덱.', array(select id from cards where code = 'OGN-001')),
  ('garen-order', '가렌 질서',   'Midrange','A', 0, '광역 버프와 튼튼한 보드로 압박.',       array(select id from cards where code = 'OGN-014'))
on conflict (slug) do nothing;

-- 용어집은 src/content/glossary.ts 를 정식 소스로 쓰고, 아래 스크립트로 동기화한다:
--   npx tsx scripts/sync-glossary.ts   (glossary.ts → glossary_terms upsert, name_en 기준)
insert into glossary_terms (name_en, term, is_official, category, definition, card_searchable) values
  ('Rune', '룬', false, '자원', '자원을 만드는 카드. 매 턴 2장 충전.', true),
  ('Battlefield', '전장', false, '존', '점령 시 점수를 얻는 중립 목표 지점.', true),
  ('Showdown', '결투', false, '전투', 'Action/Reaction 을 번갈아 쓰는 창구.', true)
on conflict (name_en) do nothing;

insert into tournaments (slug, name, format, status, starts_at, location, is_online, organizer) values
  ('rift-open-1', '리프트 오픈 #1', 'Swiss 5R + Top8', 'upcoming', now() + interval '10 days', '서울 강남', false, '리프트 리포트'),
  ('weekly-online-w36', '주간 온라인 W36', 'Single Elim', 'ongoing', now() - interval '1 hour', '온라인', true, '커뮤니티')
on conflict (slug) do nothing;

insert into reports (slug, title, excerpt, body, tag, status, published_at) values
  ('meta-snapshot-w36', 'W36 메타 스냅샷: 아리 템포의 지배', '이번 주 S티어 지형 분석.', '# 본문\n...', '메타분석', 'published', now()),
  ('ogn-set-review', 'OGN 세트 리뷰: 주목할 커먼 카드', '리미티드와 컨스트럭티드 관점.', '# 본문\n...', '세트리뷰', 'published', now() - interval '2 days')
on conflict (slug) do nothing;
