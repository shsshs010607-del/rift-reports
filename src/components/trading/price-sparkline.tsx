import { format as fmtDate } from "date-fns";

/** 의존성 없는 인라인 SVG 시세 추이 그래프. */
export function PriceSparkline({
  points,
  format = (v) => `$${v}`,
  width = 640,
  height = 140,
}: {
  points: { t: string; v: number | null }[];
  format?: (v: number) => string;
  width?: number;
  height?: number;
}) {
  const clean = points.filter((p): p is { t: string; v: number } => p.v != null);
  if (clean.length < 2) return null;

  const vals = clean.map((p) => p.v);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const padTop = 10;
  const padBottom = 22;
  const stepX = width / (clean.length - 1);
  const yOf = (v: number) => height - padBottom - ((v - min) / span) * (height - padTop - padBottom);

  const line = clean
    .map((p, i) => `${i === 0 ? "M" : "L"} ${(i * stepX).toFixed(1)} ${yOf(p.v).toFixed(1)}`)
    .join(" ");
  const area = `${line} L ${width} ${height - padBottom} L 0 ${height - padBottom} Z`;

  const first = clean[0];
  const last = clean[clean.length - 1];
  const up = last.v >= first.v;
  const stroke = up ? "rgb(var(--emerald))" : "rgb(var(--coral))";

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-36 w-full min-w-[320px]"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <line
          x1="0"
          y1={height - padBottom}
          x2={width}
          y2={height - padBottom}
          stroke="rgb(var(--outline-variant))"
          strokeWidth="1"
        />
        <path d={area} fill="url(#spark-fill)" />
        <path
          d={line}
          fill="none"
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={(clean.length - 1) * stepX} cy={yOf(last.v)} r="3.5" fill={stroke} />
      </svg>
      <div className="mt-1 flex justify-between text-[12px] text-ink-soft">
        <span>
          {fmtDate(new Date(first.t), "M.d")} · {format(first.v)}
        </span>
        <span className={up ? "font-bold text-emerald" : "font-bold text-coral"}>
          {fmtDate(new Date(last.t), "M.d")} · {format(last.v)}
        </span>
      </div>
    </div>
  );
}
