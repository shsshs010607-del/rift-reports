import type { Metadata } from "next";
import { Info } from "lucide-react";
import { PageHeading } from "@/components/ui/page-heading";
import { CARD_SETS } from "@/lib/constants";
import { getTournaments } from "@/lib/queries";
import { TournamentsView } from "@/components/tournaments/tournaments-view";

export const metadata: Metadata = { title: "다가오는 대회", alternates: { canonical: "/tournaments" } };
export const revalidate = 120;

export default async function TournamentsPage() {
  const all = await getTournaments();

  return (
    <div>
      <PageHeading
        title="다가오는 대회"
        description="한국 스탠다드(Standard) 포맷 기준 · 공인 매장 대회 · 커뮤니티 토너먼트 · 공식 이벤트"
      />
      <p className="-mt-4 mb-4 text-body-sm text-ink-soft/80">
        현재 스탠다드 사용 세트: {CARD_SETS.map((s) => `${s.code} ${s.label}`).join(" · ")}
      </p>

      <p className="mb-6 flex items-start gap-2 rounded-2xl border border-line bg-subcanvas/50 p-4 text-body-sm text-ink-soft">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary-strong" />
        각 대회의 참가 방법(사전 접수·현장 접수 등)은 매장마다 다를 수 있습니다. 참가 전 꼭 해당
        매장의 공지를 확인하시고 매장 안내를 따라주세요.
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
