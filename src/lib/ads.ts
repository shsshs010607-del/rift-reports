import { ADSENSE } from "@/lib/constants";

/**
 * 현재 브라우저 호스트가 광고 허용 목록(ADSENSE.hosts)에 있는지.
 * SSR 에선 항상 false — 광고는 클라이언트에서 마운트 후에만 붙는다.
 */
export function adsAllowedHere(): boolean {
  if (!ADSENSE.client) return false;
  if (typeof window === "undefined") return false;
  return ADSENSE.hosts.includes(window.location.hostname.toLowerCase());
}
