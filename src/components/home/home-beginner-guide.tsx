import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

/** 홈 — 초보자 가이드 바로가기 (탭 미리보기 없이 링크만). */
export function HomeBeginnerGuide() {
  return (
    <section className="note-card flex flex-wrap items-center justify-between gap-3 p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-fixed text-primary-strong">
          <BookOpen className="h-5 w-5" />
        </span>
        <div>
          <p className="text-label-sm font-bold uppercase tracking-wide text-primary-strong">
            리프트바운드가 처음이신가요?
          </p>
          <h2 className="mt-0.5 font-display text-title-lg text-ink">초보자 가이드</h2>
        </div>
      </div>
      <Link
        href="/rules"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-label-md font-bold text-white transition hover:bg-primary-container"
      >
        전체 가이드 보기
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
