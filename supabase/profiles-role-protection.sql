-- ============================================================================
--  보안 수정: profiles.role 자기 승격(self-escalation) 차단
--  발견: "본인 프로필 수정" UPDATE 정책이 행 소유권(auth.uid() = id)만 확인하고
--        어떤 컬럼이 바뀌는지는 확인하지 않음 → 로그인한 사용자가 자기 자신의
--        role 을 'admin'/'editor' 로 직접 바꿔 /admin 및 모든 스태프 전용
--        기능(공지 작성, 리포트/대회/카드샵 작성, 메타덱 삭제 등)을 탈취 가능.
--        (앱 서버 액션은 role 을 안 건드리지만, anon key + 본인 JWT 로 Supabase
--         REST API 를 브라우저에서 직접 호출하면 우회됨 — RLS 가 실제 경계.)
--
--  수정: BEFORE UPDATE 트리거로 role 변경 시도를 감지해, 액터가 스태프가
--        아니면 조용히 원래 값으로 되돌린다(정상적인 부분 업데이트는 영향 없음 —
--        role 을 안 건드리는 UPDATE 는 NEW.role 이 애초에 OLD.role 과 같음).
--
--  실행: Supabase Dashboard → SQL Editor 에 붙여넣고 실행 (1회).
-- ============================================================================

create or replace function protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not is_staff() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on profiles;
create trigger profiles_protect_role
  before update on profiles
  for each row
  execute function protect_profile_role();

-- 확인 쿼리 (실행 후):
--   update profiles set role = 'admin' where id = auth.uid();  -- 스태프 아니면 role 그대로 유지되는지 확인
