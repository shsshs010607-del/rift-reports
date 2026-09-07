import type { FxRate } from "@/lib/fx";

/** "1 USD ≈ ₩1,385 · 2026-09-07 기준" 환율 표기. */
export function FxNote({ fx, className = "" }: { fx: FxRate; className?: string }) {
  return (
    <span className={`text-body-sm text-ink-soft ${className}`}>
      JustTCG · 1&nbsp;USD ≈ ₩{fx.usdKrw.toLocaleString("ko-KR")}
      <span className="text-ink-soft/70">
        {" "}
        · {fx.asOf} 기준{fx.live ? "" : " (참고)"}
      </span>
    </span>
  );
}
