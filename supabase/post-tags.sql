-- ============================================================================
--  게시글 태그 (2026-09-15) — Supabase SQL Editor 에서 Run.
--  게시판 카테고리를 늘리지 않고 "이벤트응모" · "가입인사" 같은 자유 라벨을
--  글에 붙이기 위한 텍스트 배열 컬럼.
-- ============================================================================
alter table posts
  add column if not exists tags text[] not null default '{}'::text[];

create index if not exists posts_tags_idx on posts using gin (tags);
