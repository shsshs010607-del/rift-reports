import Link from "next/link";
import Image from "next/image";
import { SectionHeader, EmptyState } from "@/components/ui/section-header";
import { TierHeader } from "@/components/ui/tier-badge";
import { TIERS } from "@/lib/constants";
import type { Tier } from "@/lib/types/database";
import type { DeckWithChampions } from "@/lib/queries";

export function TierSummary({ decks }: { decks: DeckWithChampions[] }) {
  const summaryTiers: Tier[] = ["S", "A", "B"];
  const byTier = (t: Tier) => decks.filter((d) => d.tier === t).sort((a, b) => a.tier_rank - b.tier_rank);

  return (
    <section>
      <SectionHeader
        title="한눈에 보는 덱 티어리스트"
        description="현재 메타 기준 상위 티어 요약"
        href="/tiers"
      />
      {decks.length === 0 ? (
        <EmptyState message="티어리스트가 아직 준비되지 않았습니다." />
      ) : (
        <div className="flex flex-col gap-3">
          {summaryTiers.map((tier) => (
            <div key={tier} className="surface flex items-stretch gap-3 p-3">
              <TierHeader tier={tier} />
              <ul className="flex flex-1 flex-wrap gap-2">
                {byTier(tier).length === 0 && (
                  <li className="grid flex-1 place-items-center text-body-sm text-ink-soft">해당 티어 덱 없음</li>
                )}
                {byTier(tier).map((deck) => (
                  <li key={deck.id}>
                    <Link
                      href={`/tiers/${deck.slug}`}
                      className="flex items-center gap-2 rounded-full border-2 border-line bg-card-alt py-1 pl-1 pr-3 transition hover:border-primary hover:bg-primary-wash"
                    >
                      <span className="flex -space-x-2">
                        {deck.champions?.slice(0, 3).map((c) => (
                          <span
                            key={c.id}
                            className="relative h-7 w-7 overflow-hidden rounded-full border-2 border-card bg-subcanvas"
                          >
                            {c.image_url && (
                              <Image src={c.image_url} alt={c.name} fill sizes="28px" className="object-cover" />
                            )}
                          </span>
                        ))}
                      </span>
                      <span className="text-label-lg text-ink">{deck.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="px-1 text-body-sm text-ink-soft">
            전체 티어({TIERS.join(" · ")})와 상세 덱리스트는{" "}
            <Link href="/tiers" className="font-semibold text-primary-strong hover:underline">
              티어리스트 페이지
            </Link>
            에서 확인하세요.
          </p>
        </div>
      )}
    </section>
  );
}
