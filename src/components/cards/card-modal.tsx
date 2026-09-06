"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, X } from "lucide-react";

import type { Card } from "@/lib/types/card";
import { resolveCardText } from "@/lib/types/card";
import { CARD_DOMAINS, CARD_RARITIES, CARD_SETS, CARD_TREATMENTS, CARD_TYPES } from "@/lib/constants";
import { LocalizedCard } from "@/components/cards/localized-card";
import { cn } from "@/lib/utils";

const DOMAIN_BY_SLUG = new Map(CARD_DOMAINS.map((d) => [d.slug, d]));
const TYPE_LABEL = new Map(CARD_TYPES.map((t) => [t.slug, t.label]));
const RARITY_LABEL = new Map<string, string>(CARD_RARITIES.map((r) => [r.slug, r.label]));
const SET_LABEL = new Map<string, string>(CARD_SETS.map((s) => [s.code, s.label]));

/**
 * 카드 비교 모달 — 페이지 이동 없이 그 자리에서 카드를 크게 보고,
 * 변형 인쇄판(얼터아트·시그니처·오버넘버드·프로모)을 눌러 비교한다.
 */
export function CardModal({ card, onClose }: { card: Card; onClose: () => void }) {
  const [printingId, setPrintingId] = useState(
    () => (card.printings.find((p) => p.isBase) ?? card.printings[0])?.id,
  );
  const [locale, setLocale] = useState<"ko" | "en">("ko");

  const hasKo = Boolean(card.localization.ko);
  const activePrinting = card.printings.find((p) => p.id === printingId) ?? card.printings[0];
  const isBase = activePrinting?.isBase ?? true;
  const t = locale === "ko" && hasKo && isBase ? resolveCardText(card, "ko") : card.localization.en;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-xl sm:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 카드 이미지 */}
        <div className="shrink-0 bg-subcanvas/50 p-4 sm:w-[300px]">
          <LocalizedCard
            card={card}
            locale={locale}
            printingId={printingId}
            sizes="300px"
            priority
          />
          {card.printings.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {card.printings.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPrintingId(p.id)}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-label-sm transition",
                    p.id === printingId
                      ? "border-primary bg-primary/10 font-bold text-primary-strong"
                      : "border-line text-ink-soft hover:border-primary/40",
                  )}
                >
                  {CARD_TREATMENTS[p.treatment]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display text-title-md font-bold text-ink">{t.name}</h2>
              <p className="truncate text-body-sm text-ink-soft">
                {card.localization.en.name} · {card.setCode}
                {card.collectorNumber ? ` #${card.collectorNumber}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-subcanvas text-ink-soft hover:text-ink"
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {hasKo && (
            <div className="flex gap-1">
              {(["ko", "en"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLocale(l)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-label-sm font-bold transition",
                    locale === l ? "bg-primary text-white" : "text-ink-soft hover:bg-subcanvas",
                  )}
                >
                  {l === "ko" ? "한글" : "영문"}
                </button>
              ))}
            </div>
          )}

          <dl className="grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-2 text-body-sm">
            <Row label="확장팩">
              {SET_LABEL.get(card.setCode) ?? card.setCode}
              {card.collectorNumber ? ` · ${card.collectorNumber}번` : ""}
            </Row>
            <Row label="타입">{TYPE_LABEL.get(card.type) ?? card.type}</Row>
            <Row label="레어도">{RARITY_LABEL.get(card.rarity) ?? card.rarity}</Row>
            <Row label="코스트">{card.cost ?? "—"}</Row>
            {card.power != null && <Row label="위력">{card.power}</Row>}
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
          </dl>

          {t.text && (
            <p className="whitespace-pre-line rounded-xl bg-subcanvas/60 p-3 text-body-sm leading-relaxed text-ink">
              {t.text}
            </p>
          )}
          {!hasKo && (
            <p className="text-label-sm text-ink-soft/70">한국어 번역 준비 중입니다.</p>
          )}

          <Link
            href={`/cards/${encodeURIComponent(card.id)}`}
            className="mt-auto inline-flex items-center gap-1 self-start text-label-md font-semibold text-primary-strong hover:underline"
          >
            카드 전체 정보 <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="font-semibold text-ink-soft">{label}</dt>
      <dd className="text-ink">{children}</dd>
    </>
  );
}
