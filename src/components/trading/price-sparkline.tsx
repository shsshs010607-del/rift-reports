/** 의존성 없는 인라인 SVG 스파크라인. */
export function PriceSparkline({
  points,
  width = 640,
  height = 80,
}: {
  points: { t: string; v: number | null }[];
  width?: number;
  height?: number;
}) {
  const vals = points.map((p) => p.v).filter((v): v is number => v != null);
  if (vals.length < 2) return null;

  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const stepX = width / (points.length - 1);

  const d = points
    .map((p, i) => {
      const y = height - ((p.v ?? min) - min) / span * (height - 8) - 4;
      return `${i === 0 ? "M" : "L"} ${(i * stepX).toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const last = vals[vals.length - 1];
  const first = vals[0];
  const up = last >= first;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-20 w-full min-w-[320px]" preserveAspectRatio="none">
        <path
          d={d}
          fill="none"
          stroke={up ? "rgb(var(--emerald))" : "rgb(var(--coral))"}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div className="mt-1 flex justify-between text-body-sm text-ink-soft">
        <span>${min}</span>
        <span>${max}</span>
      </div>
    </div>
  );
}
