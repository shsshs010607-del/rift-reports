-- ============================================================================
--  덱 공유 짧은 링크 (2026-10-02) — Supabase Dashboard → SQL Editor 에서 Run.
--
--  덱 시뮬레이터의 "공유" 링크가 카드 수만큼 길어져(보통 170~250자) 디스코드·카페에
--  붙여넣으면 지저분했다. deck_shares 에 덱 코드를 저장하고 8자리 짧은 id로 발급해
--  riba.gg/d/<id> → /deck-simulator?d=<code> 로 리다이렉트한다.
--
--  로그인 없이도 덱을 공유할 수 있어야 해서(비로그인으로 덱을 짜는 사람이 많음) 익명
--  insert 를 허용하되, CHECK 제약으로 "진짜 덱 코드처럼 생긴 값"만 받는다 — 임의 텍스트를
--  저장하는 pastebin 으로 악용되는 걸 막기 위함(짧은 코드 rr1.* 또는 긴 base64url 코드).
-- ============================================================================

create table if not exists deck_shares (
  id         text primary key check (id ~ '^[a-z0-9]{6,10}$'),
  code       text not null check (
    char_length(code) between 1 and 500
    and (code ~ '^rr1\.' or code ~ '^[A-Za-z0-9_-]+$')
  ),
  created_at timestamptz not null default now()
);

create index if not exists deck_shares_created_idx on deck_shares (created_at desc);

alter table deck_shares enable row level security;

drop policy if exists "덱 공유 링크 공개 읽기" on deck_shares;
drop policy if exists "덱 공유 링크 익명 생성" on deck_shares;

create policy "덱 공유 링크 공개 읽기" on deck_shares for select using (true);

-- 로그인 여부 상관없이 누구나 생성 가능(수정·삭제는 불가 — 불변 레코드).
create policy "덱 공유 링크 익명 생성" on deck_shares
  for insert with check (true);
