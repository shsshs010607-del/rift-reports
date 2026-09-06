-- ============================================================================
--  Rift Report — Row Level Security 정책
--  원칙:
--   1. 공개 읽기 콘텐츠(카드/티어/용어/발행 리포트/대회)는 anon 도 SELECT 허용
--   2. 사용자 생성 콘텐츠는 "본인만 수정/삭제", 작성은 "로그인 + author = auth.uid()"
--   3. 관리 콘텐츠(reports/cards/decks/tournaments/glossary)는 editor·admin 만 쓰기
--   4. 클라이언트는 anon 키만 사용 → service_role 키는 서버 시드 스크립트 전용
-- ============================================================================

-- 역할 확인 헬퍼
create or replace function is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('editor', 'admin')
  );
$$;

-- 모든 테이블 RLS 활성화
alter table profiles       enable row level security;
alter table reports        enable row level security;
alter table cards          enable row level security;
alter table decks          enable row level security;
alter table deck_cards     enable row level security;
alter table glossary_terms enable row level security;
alter table posts          enable row level security;
alter table comments       enable row level security;
alter table post_likes     enable row level security;
alter table trade_listings enable row level security;
alter table tournaments    enable row level security;
alter table card_prints     enable row level security;
alter table price_snapshots enable row level security;

-- ─────────────────────────── profiles ──────────────────────────────────────
create policy "프로필 공개 읽기"      on profiles for select using (true);
create policy "본인 프로필 수정"      on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
-- INSERT 는 handle_new_user 트리거(security definer)가 담당 → 정책 불필요

-- ─────────────────────────── reports ───────────────────────────────────────
create policy "발행 리포트 읽기"      on reports for select
  using (status = 'published' or is_staff());
create policy "스태프 리포트 작성"    on reports for insert with check (is_staff());
create policy "스태프 리포트 수정"    on reports for update using (is_staff());
create policy "스태프 리포트 삭제"    on reports for delete using (is_staff());

-- ─────────────────────────── cards / decks / deck_cards / glossary ─────────
create policy "카드 공개 읽기"        on cards for select using (true);
create policy "스태프 카드 쓰기"      on cards for all using (is_staff()) with check (is_staff());

create policy "덱 공개 읽기"          on decks for select using (true);
create policy "스태프 덱 쓰기"        on decks for all using (is_staff()) with check (is_staff());

create policy "덱카드 공개 읽기"      on deck_cards for select using (true);
create policy "스태프 덱카드 쓰기"    on deck_cards for all using (is_staff()) with check (is_staff());

create policy "용어 공개 읽기"        on glossary_terms for select using (true);
create policy "스태프 용어 쓰기"      on glossary_terms for all using (is_staff()) with check (is_staff());

-- ─────────────────────────── posts ─────────────────────────────────────────
-- 공지(is_notice=true)는 스태프만 작성/수정 가능. 일반 글은 본인만.
create policy "게시글 공개 읽기"      on posts for select using (true);
create policy "로그인 게시글 작성"    on posts for insert
  with check (
    auth.uid() = author_id
    and (is_notice = false or is_staff())
    and (is_pinned = false or is_staff())
  );
create policy "본인 게시글 수정"      on posts for update
  using (auth.uid() = author_id or is_staff())
  with check (
    (auth.uid() = author_id or is_staff())
    and (is_notice = false or is_staff())
    and (is_pinned = false or is_staff())
  );
create policy "본인 게시글 삭제"      on posts for delete
  using (auth.uid() = author_id or is_staff());

-- ─────────────────────────── comments ──────────────────────────────────────
create policy "댓글 공개 읽기"        on comments for select using (true);
create policy "로그인 댓글 작성"      on comments for insert
  with check (auth.uid() = author_id);
create policy "본인 댓글 수정"        on comments for update
  using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "본인 댓글 삭제"        on comments for delete
  using (auth.uid() = author_id or is_staff());

-- ─────────────────────────── post_likes ────────────────────────────────────
create policy "좋아요 읽기"           on post_likes for select using (true);
create policy "본인 좋아요 추가"      on post_likes for insert with check (auth.uid() = user_id);
create policy "본인 좋아요 취소"      on post_likes for delete using (auth.uid() = user_id);

-- ─────────────────────────── trade_listings ────────────────────────────────
create policy "거래글 공개 읽기"      on trade_listings for select using (true);
create policy "로그인 거래글 작성"    on trade_listings for insert
  with check (auth.uid() = seller_id);
create policy "본인 거래글 수정"      on trade_listings for update
  using (auth.uid() = seller_id) with check (auth.uid() = seller_id);
create policy "본인 거래글 삭제"      on trade_listings for delete
  using (auth.uid() = seller_id or is_staff());

-- ─────────────────────────── tournaments ───────────────────────────────────
create policy "대회 공개 읽기"        on tournaments for select using (true);
create policy "스태프 대회 쓰기"      on tournaments for all using (is_staff()) with check (is_staff());

-- ─────────────────────────── card_prints / price_snapshots ─────────────────
-- 시세 동기화는 service_role 키로 실행되어 RLS 를 우회한다. 읽기는 전체 공개.
create policy "프린트 공개 읽기"      on card_prints for select using (true);
create policy "스태프 프린트 쓰기"    on card_prints for all using (is_staff()) with check (is_staff());
create policy "시세 공개 읽기"        on price_snapshots for select using (true);
create policy "스태프 시세 쓰기"      on price_snapshots for all using (is_staff()) with check (is_staff());

-- ============================================================================
--  Storage 버킷 정책 (Dashboard 에서 버킷 생성 후 적용)
--   - avatars        : public read,  본인 폴더에만 write   (avatars/{uid}/...)
--   - trade-images   : public read,  본인 폴더에만 write   (trade-images/{uid}/...)
--   - report-covers  : public read,  staff 만 write
--   - card-images    : public read,  staff 만 write
-- ============================================================================
-- 예시: trade-images 업로드 정책
-- create policy "본인 폴더 거래 이미지 업로드"
--   on storage.objects for insert to authenticated
--   with check (
--     bucket_id = 'trade-images'
--     and (storage.foldername(name))[1] = auth.uid()::text
--   );
