import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { CARD_SETS } from "@/lib/constants";
import { getTournaments } from "@/lib/queries";
import { TournamentsView } from "@/components/tournaments/tournaments-view";

export const metadata: Metadata = { title: "다가오는 대회" };
export const revalidate = 120;

export default async function TournamentsPage() {
  const all = await getTournaments();

  return (
    <div>
      <PageHeading
        title="다가오는 대회"
        description="한국 스탠다드(Standard) 포맷 기준 · 공인 매장 대회 · 커뮤니티 토너먼트 · 공식 이벤트"
      />
      <p className="-mt-4 mb-6 text-body-sm text-ink-soft/80">
        현재 스탠다드 사용 세트: {CARD_SETS.map((s) => `${s.code} ${s.label}`).join(" · ")}
      </p>

      {all.length === 0 ? (
        <p className="rounded-2xl border border-line bg-card p-10 text-center text-body-md text-ink-soft">
          등록된 대회가 없습니다. 대회 정보는 운영진이 등록합니다.
        </p>
      ) : (
        <TournamentsView tournaments={all} />
      )}
    </div>
  );
}
