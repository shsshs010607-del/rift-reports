/** 시세 표시 유틸 — JustTCG 는 USD. 화면은 원화 우선, 달러 병기. */

/** 7일 변동률(%) → 절대 USD 변동액 추정 (현재가 기준 역산). */
export function deltaUsd(marketPrice: number, changePct: number): number {
  const mp = Number(marketPrice);
  const pct = Number(changePct);
  if (!Number.isFinite(mp) || !Number.isFinite(pct) || pct <= -100) return 0;
  const prev = mp / (1 + pct / 100);
  return Number.isFinite(prev) ? mp - prev : 0;
}

export function toKrw(usd: number, rate: number): number {
  return Math.round(usd * rate);
}

export function fmtKrw(usd: number | null | undefined, rate: number): string {
  if (usd == null) return "—";
  return `₩${toKrw(usd, rate).toLocaleString("ko-KR")}`;
}

/** 부호 포함 (+₩1,200 / -₩3,400) */
export function fmtKrwSigned(usd: number | null | undefined, rate: number): string {
  if (usd == null) return "";
  const v = toKrw(usd, rate);
  if (v === 0) return "₩0";
  return `${v > 0 ? "+" : "-"}₩${Math.abs(v).toLocaleString("ko-KR")}`;
}

export function fmtUsd(v: number | null | undefined): string {
  if (v == null) return "—";
  return `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtUsdSigned(v: number | null | undefined): string {
  if (v == null) return "";
  if (v === 0) return "$0.00";
  return `${v > 0 ? "+" : "-"}$${Math.abs(v).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
