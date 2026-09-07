import Link from "next/link";
import { FileText, Flame, MapPin, TrendingUp } from "lucide-react";

import { getLatestReports, getUpcomingTournaments } from "@/lib/queries";
import { getPopularPosts } from "@/lib/community";
import { getTopGainers } from "@/lib/prices";
import { getUsdKrw } from "@/lib/fx";
import { deltaUsd, fmtKrw, fmtKrwSigned } from "@/lib/money";

/**
 * 홈 우측 사이드바 — 리포트 / 인기글 / 시세 / 대회.
 * Supabase 미연결이면 각 쿼리가 빈 배열을 반환 → "준비 중" 표시.
 */
export async function HomeSidebar() {
  const [reports, popular, gainers, tournaments, fx] = await Promise.all([
    getLatestReports(3),
    getPopularPosts({}),
    getTopGainers(3),
    getUpcomingTournaments(1),
    getUsdKrw(),
  ]);
  const tournament = tournaments[0];

  return (
    <aside className="flex flex-col gap-4">
      <Panel title="인기 메타 리포트" icon={<FileText className="h-4 w-4" />} href="/reports">
        {reports.length === 0 ? (
          <Empty>발행된 리포트가 아직 없습니다.</Empty>
        ) : (
          <ol className="flex flex-col">
            {reports.map((r, i) => (
              <Row key={r.id} href={`/reports/${r.slug}`} rank={i + 1}>
                <span className="truncate">{r.title}</span>
              </Row>
            ))}
          </ol>
        )}
      </Panel>

      <Panel title="실시간 인기글" icon={<Flame className="h-4 w-4" />} href="/community">
        {popular.posts.length === 0 ? (
          <Empty>인기글이 아직 없습니다.</Empty>
        ) : (
          <ol className="flex flex-col">
            {popular.posts.slice(0, 3).map((p, i) => (
              <Row key={p.id} href={`/community/post/${p.id}`} rank={i + 1}>
                <span className="truncate">{p.title}</span>
                <span className="shrink-0 text-label-sm text-ink-soft">♥ {p.like_count}</span>
              </Row>
            ))}
          </ol>
        )}
      </Panel>

      <Panel title="카드 시세 급등 (7일)" icon={<TrendingUp className="h-4 w-4" />} href="/trading">
        {gainers.length === 0 ? (
          <Empty>시세 데이터 준비 중입니다.</Empty>
        ) : (
          <ol className="flex flex-col">
            {gainers.map((g) => {
              const d =
                g.market_price != null && g.change_7d != null
                  ? deltaUsd(g.market_price, g.change_7d)
                  : null;
              return (
                <Row key={g.id} href={`/trading/cards/${g.print_id}`}>
                  <span className="min-w-0 flex-1 truncate">{g.print?.name ?? "—"}</span>
                  <span className="shrink-0 font-bold text-ink">{fmtKrw(g.market_price, fx.usdKrw)}</span>
                  {d != null && (
                    <span
                      className={`shrink-0 text-label-sm font-bold ${d >= 0 ? "text-emerald" : "text-coral"}`}
                    >
                      {fmtKrwSigned(d, fx.usdKrw)}
                    </span>
                  )}
                </Row>
              );
            })}
          </ol>
        )}
        <p className="mt-1.5 px-1 text-label-sm text-ink-soft">
          1 USD ≈ ₩{fx.usdKrw.toLocaleString("ko-KR")} · {fx.asOf} 기준
        </p>
      </Panel>

      <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary-wash to-card p-4">
        <p className="text-label-sm font-bold uppercase tracking-wide text-primary-strong">Tournament</p>
        <p className="mt-1 font-display text-title-md font-bold text-ink">
          {tournament ? tournament.name : "대회 정보 준비 중"}
        </p>
        <p className="mt-0.5 text-body-sm text-ink-soft">
          {tournament
            ? [tournament.prize_pool, tournament.location].filter(Boolean).join(" · ") || "자세히 보기"
            : "공인 매장 대회 · 공식 대회 일정이 여기 표시됩니다."}
        </p>
        <Link
          href="/shops"
          className="btn-primary mt-3 !w-full !justify-center !py-2 !text-label-md"
        >
          <MapPin className="h-4 w-4" />내 주변 공인 카드샵 찾기
        </Link>
      </div>
    </aside>
  );
}

function Panel({
  title,
  icon,
  href,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-label-lg font-bold text-ink">
          {icon}
          {title}
        </h3>
        <Link href={href} className="text-label-sm text-ink-soft hover:text-primary-strong">
          더보기
        </Link>
      </div>
      {children}
    </div>
  );
}

function Row({
  href,
  rank,
  children,
}: {
  href: string;
  rank?: number;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-2 rounded-lg px-1 py-1.5 text-body-sm text-ink hover:bg-subcanvas/60"
      >
        {rank != null && (
          <span className="w-4 shrink-0 text-center text-label-sm font-bold text-primary-strong">
            {rank}
          </span>
        )}
        {children}
      </Link>
    </li>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-3 text-center text-body-sm text-ink-soft">{children}</p>;
}
