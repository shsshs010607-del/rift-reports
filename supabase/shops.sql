-- ============================================================================
--  카드샵 (2026-09-08)  — Supabase SQL Editor 에 붙여넣고 Run.
-- ============================================================================

create table if not exists shops (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 1 and 80),
  sido         text not null,
  sigungu      text,
  address      text not null,
  lat          double precision,
  lng          double precision,
  phone        text,
  hours        text,                 -- 영업시간 자유 텍스트
  url          text,                 -- 홈페이지 / SNS
  is_official  boolean not null default false,   -- 리프트바운드 공인샵
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists shops_sido_idx on shops (sido, name);

alter table shops enable row level security;

drop policy if exists "카드샵 공개 읽기" on shops;
drop policy if exists "스태프 카드샵 쓰기" on shops;

create policy "카드샵 공개 읽기" on shops for select using (true);
create policy "스태프 카드샵 쓰기" on shops
  for all using (is_staff()) with check (is_staff());
