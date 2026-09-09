-- ============================================================================
--  메타 덱 (외부 대회 덱리스트 캐시) — 2026-09-09
--  Supabase SQL Editor 에 붙여넣고 Run. (setup.sql 이후 1회)
--
--  scripts/sync-meta-decks.ts 가 Piltover Archive 공개 API 에서
--  OGN/OGS(한국 스탠다드) 카드풀 덱만 가져와 채운다. 읽기는 공개.
-- ============================================================================

create table if not exists meta_decks (
  id             uuid primary key default gen_random_uuid(),
  source         text not null default 'piltoverarchive',
  source_id      text not null,
  source_url     text,
  name           text not null,
  author_name    text,
  legend_name    text,
  legend_ref     text,                 -- 짧은 덱코드용 레전드 ref (예: A299)
  domains        text[] not null default '{}',
  deck_code      text not null,        -- rr1.<...> 짧은 코드
  card_count     int not null default 0,
  likes          int not null default 0,
  views          int not null default 0,
  is_tournament  boolean not null default false,
  published_at   timestamptz,
  synced_at      timestamptz not null default now(),
  unique (source, source_id)
);

create index if not exists meta_decks_sort_idx
  on meta_decks (is_tournament desc, likes desc, published_at desc);
create index if not exists meta_decks_legend_idx on meta_decks (legend_name);

alter table meta_decks enable row level security;

drop policy if exists "메타 덱 공개 읽기" on meta_decks;
create policy "메타 덱 공개 읽기" on meta_decks for select using (true);
-- 쓰기는 service_role(스크립트)만 — 정책 없음 = 일반 사용자 차단.
