-- ============================================================================
--  "매장" 역할 추가 (2026-09-16) — Supabase Dashboard → SQL Editor 에서 Run.
--  일반 유저와 동일하지만, "매장 정보"(tournament 카테고리) 게시판 글쓰기만 추가로 허용.
--  TCG샵 운영자가 문의하면 관리자가 이 역할을 부여해준다(가입 시 자동 부여 아님).
--  매장 정보 게시판은 이제 스태프(admin/editor) 또는 role='store' 만 글을 쓸 수 있다.
-- ============================================================================

alter type user_role add value if not exists 'store';

create or replace function can_write_tournament()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and (role in ('editor', 'admin') or role = 'store')
  );
$$;

drop policy if exists "로그인 게시글 작성" on posts;
create policy "로그인 게시글 작성" on posts for insert
  with check (
    auth.uid() = author_id
    and (is_notice = false or is_staff())
    and (is_pinned = false or is_staff())
    and (category != 'tournament' or can_write_tournament())
  );

drop policy if exists "본인 게시글 수정" on posts;
create policy "본인 게시글 수정" on posts for update
  using (auth.uid() = author_id or is_staff())
  with check (
    (auth.uid() = author_id or is_staff())
    and (is_notice = false or is_staff())
    and (is_pinned = false or is_staff())
    and (category != 'tournament' or can_write_tournament())
  );

-- 확인 쿼리(실행 후, 필요할 때):
--   update profiles set role = 'store' where id = '<유저 uuid>';
