import { ADSENSE } from "@/lib/constants";

/**
 * 현재 브라우저 호스트가 광고 허용 목록(ADSENSE.hosts)에 있는지 — 로더 스크립트용.
 * SSR 에선 항상 false — 광고는 클라이언트에서 마운트 후에만 붙는다.
 * (로더는 홈 포함 모든 페이지에 둔다: 애드센스가 사이트 소유권을 다시 확인할 때 홈의 코드를 본다.)
 */
export function adsAllowedHere(): boolean {
  if (!ADSENSE.client) return false;
  if (typeof window === "undefined") return false;
  return ADSENSE.hosts.includes(window.location.hostname.toLowerCase());
}

/**
 * 광고 "칸"을 둘 수 있는 페이지 — 우리가 만든 도구·가이드·데이터처럼 자체 가치가 충분한 곳만.
 *
 * 애드센스 정책(2026-09-29 사이트 심사 반려 사유): ① 논평·부가가치 없이 남의 콘텐츠를 보여주는 화면,
 * ② 가치가 별로 없는 콘텐츠. 그래서 아래는 제외한다.
 *  - /community (카페 글 목록 미러), /community/* (다른 매장·카페 공지를 요약한 글 위주)
 *  - /tournaments, /shops (공식·매장 공지를 모은 목록)
 *  - /decks (외부에서 가져온 덱 목록), 홈(목록·링크 모음), 로그인·내 정보 등 서비스 화면
 */
const AD_UNIT_PREFIXES = ["/cards", "/deck-simulator", "/tiers", "/rules", "/glossary", "/reports", "/trading"];

export function adUnitsAllowedAt(pathname: string): boolean {
  if (!adsAllowedHere()) return false;
  return AD_UNIT_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}
