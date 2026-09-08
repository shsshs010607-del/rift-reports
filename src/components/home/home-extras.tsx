import Link from "next/link";
import { FileText, Trophy, ArrowLeftRight } from "lucide-react";

import { getLatestReports, getUpcomingTournaments, getRecentTrades } from "@/lib/queries";
import { TRADING_CATEGORIES } from "@/lib/constants";
import { fmtKstShort, fmtKstRelative } from "@/lib/datetime";

const TCAT = new Map<string, string>(TRADING_CATEGORIES.map((c) => [c.slug, c.label]));

/** 홈 하단 — 리포트 · 대회 · 거래글 3칸 압축. */
export async function HomeExtras() {
  const [reports, tournaments, trades] = await Promise.all([
    getLatestReports(4),
    getUpcomingTournaments(3),
    getRecentTrades(4),
  ]);

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <Panel title="메타 리포트" icon={<FileText className="h-4 w-4" />} href="/reports">
        {reports.length === 0 ? (
          <Empty>발행된 리포트가 없습니다.</Empty>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {reports.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/reports/${r.slug}`}
                  className="block truncate text-body-sm text-ink hover:text-primary-strong"
                >
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="다가오는 대회" icon={<Trophy className="h-4 w-4" />} href="/tournaments">
        {tournaments.length === 0 ? (
          <Empty>예정된 대회가 없습니다.</Empty>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {tournaments.map((t) => (
              <li key={t.id}>
                <Link href={`/tournaments/${t.slug}`} className="block hover:text-primary-strong">
                  <span className="block truncate text-body-sm font-semibold text-ink">
                    {t.name}
                  </span>
                  <span className="block text-[12px] text-ink-soft">{fmtKstShort(t.starts_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="최근 거래글" icon={<ArrowLeftRight className="h-4 w-4" />} href="/trading">
        {trades.length === 0 ? (
          <Empty>등록된 거래글이 없습니다.</Empty>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {trades.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/trading/${l.id}`}
                  className="flex items-center gap-1.5 hover:text-primary-strong"
                >
                  <span className="shrink-0 rounded bg-subcanvas px-1 text-[11px] font-bold text-ink-soft">
                    {TCAT.get(l.category)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-body-sm text-ink">{l.title}</span>
                  <span className="shrink-0 text-[11px] text-ink-soft">
                    {fmtKstRelative(l.created_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
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
    <div className="note-card p-4">
      <div className="mb-2 flex items-center justify-between pr-3">
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

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-3 text-center text-body-sm text-ink-soft">{children}</p>;
}
