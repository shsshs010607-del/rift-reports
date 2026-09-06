import { ArrowRight } from "lucide-react";
import { TURN_PHASES } from "@/content/beginner-guide";

export function TurnPhases() {
  return (
    <div className="surface p-5">
      <ol className="flex flex-col gap-3">
        {TURN_PHASES.map((p, i) => (
          <li key={p.short} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-label-lg font-extrabold text-white">
                {i + 1}
              </span>
              {i < TURN_PHASES.length - 1 && <span className="mt-1 h-full w-px flex-1 bg-line" />}
            </div>
            <div className="pb-2">
              <div className="flex items-baseline gap-2">
                <h4 className="font-display text-title-md text-ink">{p.phase}</h4>
                <span className="text-label-sm uppercase text-ink-soft">{p.short}</span>
              </div>
              <p className="mt-1 text-body-md text-ink-soft">{p.detail}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 flex flex-wrap items-center gap-1.5 rounded-xl bg-primary-wash px-3 py-2 text-body-sm text-primary-strong">
        각성 <ArrowRight className="h-3.5 w-3.5" /> 유지(점수) <ArrowRight className="h-3.5 w-3.5" /> 충전 2룬{" "}
        <ArrowRight className="h-3.5 w-3.5" /> 드로우 1 <ArrowRight className="h-3.5 w-3.5" /> 행동{" "}
        <ArrowRight className="h-3.5 w-3.5" /> 종료
      </p>
    </div>
  );
}
