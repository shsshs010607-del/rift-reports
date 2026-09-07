-- ============================================================================
--  로그인 사용자 덱 저장 (2026-09-08)
--  Supabase SQL Editor 에 붙여넣고 Run. (setup.sql 이후 1회)
-- ============================================================================

create table if not exists saved_decks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  code        text not null check (char_length(code) between 1 and 2000),
  legend_name text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists saved_decks_user_idx on saved_decks (user_id, updated_at desc);

alter table saved_decks enable row level security;

drop policy if exists "본인 저장덱 조회" on saved_decks;
drop policy if exists "본인 저장덱 관리" on saved_decks;

create policy "본인 저장덱 조회" on saved_decks
  for select using (auth.uid() = user_id);

create policy "본인 저장덱 관리" on saved_decks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
