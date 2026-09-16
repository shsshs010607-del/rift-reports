-- 공지 글끼리 노출 순서를 수동으로 조절할 수 있게 하는 컬럼.
-- 기본값 0 이면 지금처럼 등록순(최신순)으로 보이고, 값을 올린 공지가 같은 공지들 중 위로 올라온다.
alter table posts add column if not exists notice_priority int not null default 0;
