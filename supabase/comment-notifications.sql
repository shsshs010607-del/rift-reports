-- ============================================================================
--  댓글 알림 (2026-09-15) — Supabase SQL Editor 에서 Run.
--  내 글/댓글에 새 댓글이 달리면 그 사람에게만 보이는 개인 알림을 보낸다.
--  기존 notifications 는 "전체 공지"만 있었는데(운영진만 발송, 전체 공개 읽기),
--  user_id 를 추가해 "이 사람에게만 보이는" 개인 알림도 같은 테이블·같은 알림벨
--  UI로 처리한다 (user_id 가 null 이면 기존처럼 전체 공지).
-- ============================================================================

alter table notifications
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists notifications_user_idx on notifications (user_id, created_at desc);

alter table notifications drop constraint if exists notifications_kind_check;
alter table notifications add constraint notifications_kind_check
  check (kind in ('notice', 'update', 'event', 'comment'));

alter table notifications enable row level security;

drop policy if exists "알림 공개 읽기" on notifications;
drop policy if exists "스태프 알림 쓰기" on notifications;
drop policy if exists "알림 읽기" on notifications;
drop policy if exists "전체공지 스태프 발송" on notifications;
drop policy if exists "댓글 알림 발송" on notifications;
drop policy if exists "스태프 알림 수정" on notifications;
drop policy if exists "스태프 알림 삭제" on notifications;

-- 읽기: 전체공지(user_id null)는 누구나, 개인 알림은 본인만
create policy "알림 읽기" on notifications
  for select using (user_id is null or auth.uid() = user_id);

-- 쓰기: 전체공지는 스태프만, 개인(댓글) 알림은 로그인 유저가 "다른 사람 앞으로" 만 생성 가능
create policy "전체공지 스태프 발송" on notifications
  for insert with check (user_id is null and is_staff());

create policy "댓글 알림 발송" on notifications
  for insert with check (
    user_id is not null and auth.uid() is not null and auth.uid() <> user_id
  );

create policy "스태프 알림 수정" on notifications
  for update using (is_staff()) with check (is_staff());

create policy "스태프 알림 삭제" on notifications
  for delete using (is_staff());
