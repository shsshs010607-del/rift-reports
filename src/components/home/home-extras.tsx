import Link from "next/link";
import { Trophy, ArrowLeftRight, ArrowUpRight } from "lucide-react";

import { getUpcomingTournaments } from "@/lib/queries";
import { SITE } from "@/lib/constants";
import { fmtKstShort } from "@/lib/datetime";

/** 홈 하단 — 대회 · 거래글(네이버 카페 바로가기). */
export async function HomeExtras() {
  const tournaments = await getUpcomingTournaments(4);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
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

      <div className="note-card p-4">
        <h3 className="mb-2 flex items-center gap-1.5 text-label-lg font-bold text-ink">
          <ArrowLeftRight className="h-4 w-4" />
          거래글
        </h3>
        <a
          href={SITE.naverCafeTrade}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl border border-[#03C75A]/30 bg-[#03C75A]/10 px-3 py-2.5 text-body-sm font-bold text-ink transition hover:bg-[#03C75A]/15"
        >
          네이버 카페에서 카드 거래글 보기
          <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-ink-soft" />
        </a>
      </div>
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
