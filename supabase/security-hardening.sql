-- ============================================================================
--  보안 강화 (2026-09-21) — Supabase Dashboard → SQL Editor 에서 1회 Run.
--  store-role-tournament-write.sql 을 먼저(또는 같이) 실행해도 순서 무관.
--
--  1) 알림 스팸/피싱 차단
--     기존 "댓글 알림 발송" 정책은 로그인한 누구나 "다른 사람 앞으로" 제목·본문·링크를
--     자유롭게 넣어 알림을 만들 수 있었다 → 외부 피싱 링크, 도배 가능.
--     이제 kind='comment' + 본인 created_by + 사이트 내부 글 링크(/community/post/…)만 허용.
--
--  2) profiles.role 보호 트리거 보완
--     - 기존: 스태프가 아니면 되돌림 → SQL Editor/서비스 롤(auth.uid() 가 null)에서
--       `update profiles set role='store'` 를 해도 조용히 원복되어 "매장" 역할을 못 줬다.
--     - 기존: editor 도 role 을 바꿀 수 있어 editor → admin 자기 승격이 가능했다.
--     이제 SQL Editor/서비스 롤(auth.uid() null) 또는 admin 만 role 변경 가능.
-- ============================================================================

-- 1) 알림 정책 ---------------------------------------------------------------
drop policy if exists "댓글 알림 발송" on notifications;
create policy "댓글 알림 발송" on notifications
  for insert with check (
    user_id is not null
    and auth.uid() is not null
    and auth.uid() <> user_id
    and kind = 'comment'
    and created_by = auth.uid()
    and href like '/community/post/%'
    and char_length(title) <= 60
    and char_length(coalesce(body, '')) <= 120
  );

-- 2) role 보호 트리거 ----------------------------------------------------------
create or replace function protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    -- auth.uid() 가 null = SQL Editor / service_role / 마이그레이션 → 허용
    -- 그 외에는 admin 만 role 변경 가능
    if auth.uid() is not null and not exists (
      select 1 from public.profiles where id = auth.uid() and role::text = 'admin'
    ) then
      new.role := old.role;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on profiles;
create trigger profiles_protect_role
  before update on profiles
  for each row
  execute function protect_profile_role();

-- 확인 (일반 계정으로 로그인한 상태에서 REST 로 시도하면 role 이 그대로여야 함):
--   select id, username, role from profiles where role <> 'user';
