-- ============================================================================
--  개발용 시드 데이터 (선택). `supabase db reset` 시 자동 실행.
--  주의: auth.users 가 없으므로 author_id 는 NULL 로 둔다.
-- ============================================================================

insert into cards (code, name, name_en, set_code, rarity, domains, type, cost, might, text) values
  ('OGN-001', '아리', 'Ahri', 'OGN', 'epic',    array['mind'],        'champion', 3, 3, '소환 시: 카드 1장을 뽑는다.'),
  ('OGN-014', '가렌', 'Garen', 'OGN', 'rare',   array['body','order'],'champion', 4, 5, '방어도 2.'),
  ('OGN-032', '점화', 'Ignite', 'OGN', 'common',array['fury'],        'spell',    1, null,'유닛에게 피해 2.')
on conflict (code) do nothing;

insert into decks (slug, name, archetype, tier, tier_rank, summary, champion_card_ids) values
  ('ahri-tempo',  '아리 템포',   'Tempo',   'S', 0, '유연한 카드 어드밴티지 기반 중속 덱.', array(select id from cards where code = 'OGN-001')),
  ('garen-order', '가렌 질서',   'Midrange','A', 0, '광역 버프와 튼튼한 보드로 압박.',       array(select id from cards where code = 'OGN-014'))
on conflict (slug) do nothing;

insert into glossary_terms (term, reading, category, definition) values
  ('룬', 'Rune', '자원', '매 턴 배치해 마나처럼 사용하는 자원 카드.'),
  ('전장', 'Battlefield', '규칙', '점령 시 점수를 얻는 중립 목표 지점.'),
  ('오버넘버드', 'Overnumbered', '레어도', '한 세트에 소량만 존재하는 최고 희귀도 등급.')
on conflict (term) do nothing;

insert into tournaments (slug, name, format, status, starts_at, location, is_online, organizer) values
  ('rift-open-1', '리프트 오픈 #1', 'Swiss 5R + Top8', 'upcoming', now() + interval '10 days', '서울 강남', false, '리프트 리포트'),
  ('weekly-online-w36', '주간 온라인 W36', 'Single Elim', 'ongoing', now() - interval '1 hour', '온라인', true, '커뮤니티')
on conflict (slug) do nothing;

insert into reports (slug, title, excerpt, body, tag, status, published_at) values
  ('meta-snapshot-w36', 'W36 메타 스냅샷: 아리 템포의 지배', '이번 주 S티어 지형 분석.', '# 본문\n...', '메타분석', 'published', now()),
  ('ogn-set-review', 'OGN 세트 리뷰: 주목할 커먼 카드', '리미티드와 컨스트럭티드 관점.', '# 본문\n...', '세트리뷰', 'published', now() - interval '2 days')
on conflict (slug) do nothing;
