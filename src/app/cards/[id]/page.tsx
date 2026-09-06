import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeading } from "@/components/ui/page-heading";
import { LocalizedCard } from "@/components/cards/localized-card";
import { CardText } from "@/components/cards/card-text";
import { getCardService, CardServiceError } from "@/lib/services/cardService";
import { resolveCardText } from "@/lib/types/card";
import { CARD_DOMAINS, CARD_RARITIES, CARD_SETS, CARD_TYPES } from "@/lib/constants";

const DOMAIN_BY_SLUG = new Map(CARD_DOMAINS.map((d) => [d.slug, d]));
const TYPE_LABEL = new Map(CARD_TYPES.map((t) => [t.slug, t.label]));
const RARITY_LABEL = new Map<string, string>(CARD_RARITIES.map((r) => [r.slug, r.label]));
const SET_LABEL = new Map<string, string>(CARD_SETS.map((s) => [s.code, s.label]));

/**
 * 카드 상세 — 어댑터의 getCardById() 사용 예시.
 * 데이터 소스는 NEXT_PUBLIC_DATA_SOURCE 가 결정하므로 이 페이지는 소스에 무관하다.
 */
export default async function CardDetailPage({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);

  let card;
  try {
    card = await getCardService().getCardById(id);
  } catch (err) {
    if (err instanceof CardServiceError) {
      console.error("[CardDetailPage]", err);
      return (
        <div>
          <PageHeading title="카드 상세" />
          <p className="rounded-2xl border border-error/30 bg-error/5 p-6 text-center text-body-sm text-ink-soft">
            카드 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        </div>
      );
    }
    throw err;
  }

  if (!card) notFound();

  const ko = resolveCardText(card, "ko");
  const en = resolveCardText(card, "en");
  const hasKo = Boolean(card.localization.ko);

  return (
    <div>
      <Link
        href="/cards"
        className="mb-4 inline-flex items-center gap-1 text-body-sm text-ink-soft hover:text-primary-strong"
      >
        <ArrowLeft className="h-4 w-4" /> 카드 목록
      </Link>

      <PageHeading
        title={ko.name}
        description={`${en.name} · ${card.setCode}${card.collectorNumber ? ` #${card.collectorNumber}` : ""}`}
      />

      <div className="grid gap-6 sm:grid-cols-[minmax(0,260px)_1fr]">
        <div>
          <LocalizedCard card={card} sizes="(max-width: 640px) 90vw, 260px" priority />
        </div>

        <dl className="flex flex-col gap-3 text-body-sm">
          <Row label="확장팩">
            {SET_LABEL.get(card.setCode) ?? card.setCode}
            {card.collectorNumber ? ` · ${card.collectorNumber}번` : ""}
          </Row>
          <Row label="타입">{TYPE_LABEL.get(card.type) ?? card.type}</Row>
          <Row label="레어도">{RARITY_LABEL.get(card.rarity) ?? card.rarity}</Row>
          <Row label="코스트">{card.cost ?? "—"}</Row>
          <Row label="위력 / 체력">
            {card.power ?? "—"} / {card.toughness ?? "—"}
          </Row>
          <Row label="도메인">
            <span className="flex flex-wrap gap-1.5">
              {card.domains.length === 0 && "무색"}
              {card.domains.map((slug) => {
                const d = DOMAIN_BY_SLUG.get(slug);
                return (
                  <span key={slug} className="inline-flex items-center gap-1">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: d?.color ?? "#999" }}
                    />
                    {d?.label ?? slug}
                  </span>
                );
              })}
            </span>
          </Row>
          {card.subtypes.length > 0 && <Row label="태그">{card.subtypes.join(", ")}</Row>}
          {hasKo && (
            <Row label="효과 (한국어)">
              {ko.text ? <CardText text={ko.text} className="whitespace-pre-line" /> : "—"}
            </Row>
          )}
          <Row label={hasKo ? "효과 (영문)" : "효과"}>
            {en.text || "—"}
            {!hasKo && (
              <span className="mt-1 block text-label-sm text-ink-soft/70">
                한국어 번역 준비 중 — 나오면 자동 반영됩니다.
              </span>
            )}
          </Row>
          {card.artist && <Row label="일러스트">{card.artist}</Row>}
        </dl>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6rem_1fr] gap-3 border-b border-line pb-3">
      <dt className="font-semibold text-ink-soft">{label}</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  );
}
