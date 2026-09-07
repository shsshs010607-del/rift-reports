import "server-only";

/**
 * USD → KRW 기준 환율.
 * open.er-api.com (무키·무료) 에서 12시간마다 갱신, 실패 시 아래 상수로 폴백.
 * 시세 자체가 근사값이라 정수 원 단위로 반올림해 쓴다.
 */
const FALLBACK_USD_KRW = 1385;
const FALLBACK_AS_OF = "2026-09-07";

export interface FxRate {
  /** 1 USD 당 원 */
  usdKrw: number;
  /** 환율 기준일 (YYYY-MM-DD) */
  asOf: string;
  /** 라이브 조회 성공 여부 (false = 폴백 상수) */
  live: boolean;
}

export async function getUsdKrw(): Promise<FxRate> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 43_200 }, // 12h
    });
    if (!res.ok) throw new Error(String(res.status));
    const j = (await res.json()) as {
      rates?: Record<string, number>;
      time_last_update_utc?: string;
    };
    const rate = j.rates?.KRW;
    if (typeof rate === "number" && rate > 500 && rate < 3000) {
      const asOf = j.time_last_update_utc
        ? new Date(j.time_last_update_utc).toISOString().slice(0, 10)
        : FALLBACK_AS_OF;
      return { usdKrw: Math.round(rate), asOf, live: true };
    }
    throw new Error("환율 값 이상");
  } catch {
    return { usdKrw: FALLBACK_USD_KRW, asOf: FALLBACK_AS_OF, live: false };
  }
}
