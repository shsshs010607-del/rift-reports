import Link from "next/link";
import { Sparkles, LayoutGrid, BookOpen } from "lucide-react";
import {
  getLatestReports,
  getTierSummary,
  getRecentTrades,
  getUpcomingTournaments,
} from "@/lib/queries";
import { ReportHighlights } from "@/components/home/report-highlights";
import { TierSummary } from "@/components/home/tier-summary";
import { TradingPreview } from "@/components/home/trading-preview";
import { TournamentPreview } from "@/components/home/tournament-preview";
import { SITE } from "@/lib/constants";

export const revalidate = 60; // 홈은 60초 ISR

export default async function HomePage() {
  const [reports, decks, trades, tournaments] = await Promise.all([
    getLatestReports(4),
    getTierSummary(),
    getRecentTrades(4),
    getUpcomingTournaments(3),
  ]);

  return (
    <div className="flex flex-col gap-12">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl border border-line/80 bg-gradient-to-br from-primary-wash via-card to-card-alt p-8 shadow-e1 lg:p-12">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-amber/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <span className="chip">
            <Sparkles className="h-3.5 w-3.5" />
            리프트바운드 메타 리포트
          </span>
          <h1 className="mt-4 font-display text-headline-lg text-ink lg:text-display-hero">
            {SITE.name}에서 이번 주 메타를 읽다
          </h1>
          <p className="mt-3 text-body-lg text-ink-soft">
            티어리스트, 카드 DB, 룰 가이드, 커뮤니티와 카드 거래까지 —{" "}
            리프트바운드 플레이에 필요한 모든 정보를 한 곳에서.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/tiers" className="btn-primary">
              <LayoutGrid className="h-4 w-4" />
              덱 티어리스트 보기
            </Link>
            <Link href="/rules" className="btn-ghost">
              <BookOpen className="h-4 w-4" />
              초보자 가이드
            </Link>
          </div>
        </div>
      </section>

      {/* ── 대시보드 그리드 ──────────────────────────────── */}
      <ReportHighlights reports={reports} />

      <TierSummary decks={decks} />

      <div className="grid gap-12 xl:grid-cols-2">
        <TradingPreview trades={trades} />
        <TournamentPreview tournaments={tournaments} />
      </div>
    </div>
  );
}
