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
