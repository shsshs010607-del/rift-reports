-- ============================================================================
--  로그인 / 닉네임 온보딩 (2026-09-07)
--  Supabase SQL Editor 에 붙여넣고 실행. (setup.sql 이후 1회)
-- ============================================================================

-- 1. profiles.onboarded — 사용자가 닉네임을 "직접" 정했는지 여부
alter table profiles add column if not exists onboarded boolean not null default false;

-- 이미 가입한 계정은 그대로 통과 (이 기능 이전 사용자)
update profiles set onboarded = true where created_at < now();

-- 2. 닉네임 대소문자 무시 중복 방지
create unique index if not exists profiles_username_lower_idx on profiles (lower(username));

-- 3. 가입 트리거 교체
--    소셜 로그인은 provider 마다 메타데이터 키가 달라, 가입 시엔 충돌 없는
--    임시 username 만 넣고 아바타를 채운다. 진짜 닉네임은 /onboarding 에서 확정.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, avatar_url, onboarded)
  values (
    new.id,
    'user_' || substr(replace(new.id::text, '-', ''), 1, 12),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    ),
    false
  )
  on conflict (id) do nothing;
  return new;
end $$;

-- 4. 닉네임 사용 가능 여부 (RLS 우회, 대소문자·공백 무시)
create or replace function username_available(name text)
returns boolean language sql security definer set search_path = public stable as $$
  select
    char_length(trim(name)) between 2 and 20
    and not exists (
      select 1 from profiles where lower(username) = lower(trim(name))
    );
$$;
grant execute on function username_available(text) to anon, authenticated;
