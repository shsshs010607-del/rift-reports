import { ADSENSE } from "@/lib/constants";

/**
 * 애드센스 "복제된 콘텐츠" 정책 — 논평·부가가치 없이 다른 사이트의 글 목록을 그대로
 * 보여주는 화면에는 광고를 달 수 없다(2026-09-29 사이트 심사 반려 사유).
 * /community 기본 화면은 네이버 카페 자유게시판 글 목록을 그대로 링크만 걸어 보여주는
 * 화면이라 여기서 막는다. /community/[category] (리포트·게시판·매장 정보)는 우리 DB의
 * 자체 글이라 대상 아님.
 */
const AD_BLOCKED_PATHS = new Set(["/community"]);

/**
 * 현재 브라우저 호스트가 광고 허용 목록(ADSENSE.hosts)에 있고, 이 경로가 광고 차단
 * 목록에 없는지. SSR 에선 항상 false — 광고는 클라이언트에서 마운트 후에만 붙는다.
 */
export function adsAllowedHere(): boolean {
  if (!ADSENSE.client) return false;
  if (typeof window === "undefined") return false;
  if (AD_BLOCKED_PATHS.has(window.location.pathname)) return false;
  return ADSENSE.hosts.includes(window.location.hostname.toLowerCase());
}
