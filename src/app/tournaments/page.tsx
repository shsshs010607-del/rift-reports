import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { getTournaments } from "@/lib/queries";
import { TournamentCard, STATUS_LABEL } from "@/components/tournaments/tournament-card";
import type { Tournament } from "@/lib/types/database";

export const metadata: Metadata = { title: "대회 정보" };
export const revalidate = 120;

const ORDER: Tournament["status"][] = ["ongoing", "upcoming", "finished"];

export default async function TournamentsPage() {
  const all = await getTournaments();

  const groups = ORDER.map((status) => ({
    status,
    items: all.filter((t) => t.status === status),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      <PageHeading title="대회 정보" description="공인 매장 대회 · 커뮤니티 토너먼트 · 공식 이벤트" />

      {all.length === 0 ? (
        <p className="rounded-2xl border border-line bg-card p-10 text-center text-body-md text-ink-soft">
          등록된 대회가 없습니다. 대회 정보는 운영진이 등록합니다.
        </p>
      ) : (
        <div className="flex flex-col gap-10">
          {groups.map((g) => (
            <section key={g.status}>
              <h2 className="section-title mb-3">
                {STATUS_LABEL[g.status]}
                <span className="ml-2 text-body-sm font-normal text-ink-soft">{g.items.length}</span>
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((t) => (
                  <li key={t.id}>
                    <TournamentCard t={t} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
