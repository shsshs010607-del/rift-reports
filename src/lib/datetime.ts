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

/** "2026.09.18" (KST) */
export function fmtKstDate(iso: string): string {
  const { y, m, d } = kstYmd(iso);
  return `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")}`;
}

/**
 * 목록용: 오늘이면 "14:30", 올해면 "09.18", 그 외 "24.09.18" (전부 KST).
 * date-fns 의 서버 로컬(UTC) 버그를 피하려고 Intl 로 계산한다.
 */
export function fmtKstListTime(iso: string): string {
  const now = kstYmd(new Date().toISOString());
  const t = kstYmd(iso);
  if (now.y === t.y && now.m === t.m && now.d === t.d) return fmtKstTime24(iso);
  if (now.y === t.y) return `${String(t.m).padStart(2, "0")}.${String(t.d).padStart(2, "0")}`;
  return `${String(t.y).slice(2)}.${String(t.m).padStart(2, "0")}.${String(t.d).padStart(2, "0")}`;
}

/** "14:30" (24시간, KST) */
export function fmtKstTime24(iso: string): string {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    timeZone: KST,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * 상대 시간: "방금 전" / "12분 전" / "3시간 전" / "2일 전", 일주일 넘으면 "2026.09.01".
 * 렌더 시점(서버는 revalidate 주기, 클라는 마운트) 기준이라 약간 지연될 수 있다.
 */
export function fmtKstRelative(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 45) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
  return fmtKstDate(iso);
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
