-- 내 컬렉션 옛 카드 id → 새 카드 id 이전 (2026-09-26)
-- Supabase SQL Editor 에서 한 번만 실행하세요.
--
-- 카드 데이터 소스를 Riftcodex → playriftbound.com 으로 바꾸면서 카드 id 형식이 바뀌었다
-- (예: 69bc5bc7d308c64675ca86c3 → ogn-013-298). 소스 교체 전에 담은 컬렉션 14행(1계정)이
-- 새 카드 목록에서 안 찾아져서 내 컬렉션에서 사진이 회색 박스로 보였다.
-- 옛 id 는 이전 Riftcodex 스냅샷에서 이름·수집번호를 확인해 새 id 로 1:1 매핑했다.
--
-- 이미 새 id 행이 있으면 수량을 더해 합치고, 옛 행은 지운다.

with map(old_id, new_id) as (
  values
    ('69bc5bc7d308c64675ca86c3', 'ogn-013-298'), -- Pouty Poro
    ('69bc5bc9d308c64675ca86f4', 'ogn-057-298'), -- Block
    ('69bc5bc6d308c64675ca86b7', 'ogn-002-298'), -- Brazen Buccaneer
    ('69bc5bc8d308c64675ca86d9', 'ogn-033-298'), -- Shakedown
    ('69bc5bc7d308c64675ca86ce', 'ogn-024-298'), -- Void Seeker
    ('69bc5bc8d308c64675ca86da', 'ogn-034-298'), -- Tryndamere - Barbarian
    ('69bc5bc8d308c64675ca86e2', 'ogn-041-298'), -- Volibear - Furious
    ('69bc5bcad308c64675ca86fa', 'ogn-063-298'), -- Spirit's Refuge
    ('69bc5bc9d308c64675ca86f6', 'ogn-059-298'), -- Eclipse Herald
    ('69bc5bcad308c64675ca86fd', 'ogn-066-298'), -- Ahri - Alluring
    ('69bc5bcad308c64675ca86ff', 'ogn-067-298'), -- Blitzcrank - Impassive
    ('69bc5bcad308c64675ca8702', 'ogn-070-298'), -- Mageseeker Warden
    ('69bc5bcad308c64675ca8701', 'ogn-069-298'), -- Last Stand
    ('69bc5bcad308c64675ca8704', 'ogn-072-298')  -- Solari Shrine
),
moved as (
  delete from public.collection_items ci
  using map m
  where ci.card_id = m.old_id
  returning ci.user_id, m.new_id, ci.quantity
)
insert into public.collection_items (user_id, card_id, quantity)
select user_id, new_id, quantity from moved
on conflict (user_id, card_id)
do update set
  quantity   = least(999, public.collection_items.quantity + excluded.quantity),
  updated_at = now();
