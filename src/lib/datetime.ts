/**
 * 한국 시간대(Asia/Seoul) 고정 날짜/시간 포맷터.
 * 서버(Vercel=UTC)와 클라이언트(브라우저 로컬)에서 결과가 달라지지 않도록
 * 항상 timeZone: "Asia/Seoul" 로 렌더한다. 사이트가 국내 전용이라 KST 로 못박음.
 */
const KST = "Asia/Seoul";

/** "2026년 9월 18일 (금) 11:00" */
export function fmtKstFull(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: KST,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** "2026.09.18 (금) 11:00" */
export function fmtKstShort(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: KST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** "9월 18일 11:00" (종료일 등 짧게) */
export function fmtKstMonthDayTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: KST,
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** "오전 11:00" */
export function fmtKstTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    timeZone: KST,
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** KST 기준 그 날짜의 연/월/일 (달력 셀 매칭용). */
export function kstYmd(iso: string): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: KST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get("year"), m: get("month"), d: get("day") };
}
