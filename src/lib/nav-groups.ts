export type NavItem = { href: string; label: string; desc?: string };
export type NavGroup = { label: string; items: readonly NavItem[] };

/** 상단바 — 같은 기능끼리 묶은 메뉴. href 가 "report:" 면 디스코드 신고 게시판, ".html" 은 새 탭. */
export const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: "카드·덱",
    items: [
      { href: "/cards", label: "카드 검색", desc: "카드 DB · 필터" },
      { href: "/decks", label: "메타 덱", desc: "대회 덱리스트" },
      { href: "/tiers", label: "덱 티어리스트", desc: "레전드별 티어" },
      { href: "/deck-simulator", label: "덱 빌더", desc: "덱 구성 · 샘플 핸드" },
    ],
  },
  {
    label: "컬렉션·거래",
    items: [
      { href: "/collection", label: "내 컬렉션", desc: "보유 카드 관리" },
      { href: "/trading", label: "트레이딩", desc: "시세 · 거래" },
    ],
  },
  {
    label: "도구·재미",
    items: [
      { href: "/cards/proxy", label: "프록시 출력", desc: "덱 프록시 인쇄" },
      { href: "/origins-sim.html", label: "오리진 언박싱", desc: "팩·박스 까기" },
      { href: "/nexus-promo-sim.html", label: "넥서스 나이트 프로모", desc: "프로모 팩 까기" },
      { href: "/tiers?quiz=1", label: "MBTI 덱 찾기", desc: "나에게 맞는 덱" },
    ],
  },
  {
    label: "커뮤니티",
    items: [
      { href: "/community", label: "커뮤니티", desc: "게시판 · 덱 공략" },
      { href: "/reports", label: "소식", desc: "리포트 · 뉴스" },
    ],
  },
  {
    label: "매장·대회",
    items: [
      { href: "/shops", label: "주변 매장", desc: "카드샵 찾기" },
      { href: "/tournaments", label: "다가오는 대회", desc: "매장 대회 일정" },
    ],
  },
  {
    label: "가이드",
    items: [
      { href: "/rules", label: "초보자 가이드", desc: "규칙 · 진행" },
      { href: "/glossary", label: "용어", desc: "공식 용어집" },
      { href: "report:", label: "오역 신고", desc: "오역·버그 제보" },
    ],
  },
];
