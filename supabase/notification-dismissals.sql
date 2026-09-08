-- ============================================================================
--  알림 개인 삭제 (2026-09-08) — Supabase SQL Editor 에서 Run.
--  알림은 전체 공지라 실제로 지우지 않고, 사용자별로 "숨김" 처리한다.
-- ============================================================================

create table if not exists notification_dismissals (
  notification_id uuid not null references notifications(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  created_at      timestamptz not null default now(),
  primary key (notification_id, user_id)
);

create index if not exists notification_dismissals_user_idx
  on notification_dismissals (user_id);

alter table notification_dismissals enable row level security;

drop policy if exists "본인 알림 숨김 조회" on notification_dismissals;
drop policy if exists "본인 알림 숨김 관리" on notification_dismissals;

create policy "본인 알림 숨김 조회" on notification_dismissals
  for select using (auth.uid() = user_id);
create policy "본인 알림 숨김 관리" on notification_dismissals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
