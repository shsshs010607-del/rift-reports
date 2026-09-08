-- 내 컬렉션(보유 카드) — collection_items
-- Supabase SQL Editor 에서 실행하세요.
--
-- card_id = 앱의 대표 카드 id (Card.id, 예: Riftcodex id 문자열).
-- quantity 는 0~999. 덱 규칙(이름당 3장)과 무관하게 실제 보유 수량을 그대로 저장한다.

create table if not exists public.collection_items (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  card_id    text        not null,
  quantity   integer     not null default 1 check (quantity >= 0 and quantity <= 999),
  updated_at timestamptz not null default now(),
  primary key (user_id, card_id)
);

alter table public.collection_items enable row level security;

drop policy if exists "collection_select_own" on public.collection_items;
create policy "collection_select_own" on public.collection_items
  for select using (auth.uid() = user_id);

drop policy if exists "collection_insert_own" on public.collection_items;
create policy "collection_insert_own" on public.collection_items
  for insert with check (auth.uid() = user_id);

drop policy if exists "collection_update_own" on public.collection_items;
create policy "collection_update_own" on public.collection_items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "collection_delete_own" on public.collection_items;
create policy "collection_delete_own" on public.collection_items
  for delete using (auth.uid() = user_id);
