-- ============================================================================
--  대회 분류 (2026-09-08) — Supabase SQL Editor 에서 Run.
--  공식 이벤트 / 매장 대회 / 커뮤니티 대회 를 구분한다. 비공식(매장·커뮤니티)도 등록 가능.
-- ============================================================================

alter table tournaments
  add column if not exists category text not null default 'community'
    check (category in ('official', 'shop', 'community'));

-- 기존 라이엇 주최 이벤트는 공식으로
update tournaments set category = 'official'
  where organizer ilike '%라이엇%' or organizer ilike '%riot%';
