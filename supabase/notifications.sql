-- ============================================================================
--  알림 (2026-09-08)  — Supabase SQL Editor 에 붙여넣고 Run.
--
--  운영진이 사이트 전체에 공지/업데이트/이벤트 알림을 발송한다.
--  개별 유저는 마지막 확인 시각(profiles.notifications_seen_at)만 저장 →
--  그보다 새 알림 = 안 읽음. "모두 읽음" = seen_at 을 now() 로.
-- ============================================================================

create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 1 and 120),
  body        text check (char_length(body) <= 1000),
  href        text,
  kind        text not null default 'notice' check (kind in ('notice', 'update', 'event')),
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_created_idx on notifications (created_at desc);

alter table notifications enable row level security;

drop policy if exists "알림 공개 읽기" on notifications;
drop policy if exists "스태프 알림 쓰기" on notifications;

create policy "알림 공개 읽기" on notifications for select using (true);
create policy "스태프 알림 쓰기" on notifications
  for all using (is_staff()) with check (is_staff());

-- 마지막 확인 시각 (없으면 가입 시각 기준으로 초기화)
alter table profiles
  add column if not exists notifications_seen_at timestamptz not null default now();

-- 기존 회원은 지금까지의 알림을 읽은 것으로 처리
update profiles set notifications_seen_at = now() where notifications_seen_at is null;
