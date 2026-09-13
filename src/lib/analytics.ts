import { GA } from "@/lib/constants";

/**
 * 현재 브라우저 호스트가 GA 허용 목록(GA.hosts)에 있는지.
 * SSR 에선 항상 false — 로컬 개발·프리뷰 배포 트래픽이 실 데이터에 안 섞이게 한다.
 */
export function gaAllowedHere(): boolean {
  if (!GA.id) return false;
  if (typeof window === "undefined") return false;
  return GA.hosts.includes(window.location.hostname.toLowerCase());
}
