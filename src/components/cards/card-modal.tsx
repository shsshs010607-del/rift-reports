"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tag, X, Printer } from "lucide-react";

import type { Card } from "@/lib/types/card";
import { resolveCardText, cardNumber } from "@/lib/types/card";
import { CARD_DOMAINS, CARD_SETS, CARD_TREATMENTS, CARD_TYPES } from "@/lib/constants";
import { domainGradient, domainWash, rarityStyle } from "@/lib/card-style";
import { BAN_TAG } from "@/lib/cards/banned";
import { renderProxyImage, proxyFileName } from "@/lib/cards/proxy-image";
import { LocalizedCard } from "@/components/cards/localized-card";
import { CardText } from "@/components/cards/card-text";
import { cn } from "@/lib/utils";

const DOMAIN_BY_SLUG = new Map(CARD_DOMAINS.map((d) => [d.slug, d]));
const TYPE_LABEL = new Map(CARD_TYPES.map((t) => [t.slug, t.label]));
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
  const [proxyBusy, setProxyBusy] = useState(false);

  const hasKo = Boolean(card.localization.ko);
  const activePrinting = card.printings.find((p) => p.id === printingId) ?? card.printings[0];
  const isBase = activePrinting?.isBase ?? true;
  const t = locale === "ko" && hasKo && isBase ? resolveCardText(card, "ko") : card.localization.en;
  const wash = domainWash(card.domains);
  const rarity = rarityStyle(card.rarity);

  async function downloadProxy() {
    setProxyBusy(true);
    try {
      const blob = await renderProxyImage(card, locale);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = proxyFileName(card);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      /* noop */
    } finally {
      setProxyBusy(false);
    }
  }

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
      className="fixed inset-0 z-[70] flex items-center justify-center bg-scrim/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-xl sm:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 z-10 h-1"
          style={{ background: domainGradient(card.domains) }}
        />
        {/* 카드 이미지 */}
        <div className="shrink-0 p-4 sm:w-[300px]" style={{ backgroundImage: wash }}>
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
              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                {card.subtypes.includes(BAN_TAG) && (
                  <span className="rounded-full bg-error px-2 py-0.5 text-[10px] font-black text-white">
                    밴
                  </span>
                )}
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide",
                    rarity.className,
                  )}
                >
                  {rarity.label}
                </span>
                <span className="flex items-center gap-1">
                  {card.domains.map((slug) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={slug} src={`/domains/${slug}.svg`} alt="" width={14} height={14} className="h-3.5 w-3.5" />
                  ))}
                </span>
              </div>
              <h2 className="font-display text-title-lg font-bold text-ink">{t.name}</h2>
              <p className="truncate text-body-sm text-ink-soft">
                {card.localization.en.name}
                {cardNumber(card) ? ` · ${cardNumber(card)}` : ""}
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
            </Row>
            {cardNumber(card) && (
              <Row label="카드 번호">
                <span className="font-mono">{cardNumber(card)}</span>
              </Row>
            )}
            <Row label="타입">{TYPE_LABEL.get(card.type) ?? card.type}</Row>
            <Row label="레어도">
              <span className={cn("rounded-full px-2 py-0.5 text-label-sm font-bold", rarity.className)}>
                {rarity.label}
              </span>
            </Row>
            <Row label="코스트">{card.cost ?? "—"}</Row>
            {card.power != null && <Row label="위력">{card.power}</Row>}
            <Row label="도메인">
              <span className="flex flex-wrap gap-1.5">
                {card.domains.length === 0 && "무색"}
                {card.domains.map((slug) => {
                  const d = DOMAIN_BY_SLUG.get(slug);
                  return (
                    <span key={slug} className="inline-flex items-center gap-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/domains/${slug}.svg`} alt="" width={16} height={16} className="h-4 w-4" />
                      {d?.label ?? slug}
                    </span>
                  );
                })}
              </span>
            </Row>
            {card.subtypes.length > 0 && (
              <Row label="태그">
                <span className="flex flex-wrap gap-1.5">
                  {card.subtypes.map((tag) => (
                    <Link
                      key={tag}
                      href={`/cards?q=${encodeURIComponent(tag)}`}
                      onClick={onClose}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-label-sm font-bold text-primary-strong transition hover:bg-primary/20"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </Link>
                  ))}
                </span>
              </Row>
            )}
          </dl>

          {t.text && (
            <CardText
              text={t.text}
              linkTo="cards"
              onNavigate={onClose}
              className="whitespace-pre-line rounded-xl bg-subcanvas/60 p-3 text-body-sm leading-relaxed text-ink"
            />
          )}
          {t.text && (
            <p className="-mt-1 text-label-sm text-ink-soft/70">
              태그·<span className="font-bold text-primary-strong">[대괄호]</span> 용어를 누르면 그 효과가 있는 카드로 이동합니다.
            </p>
          )}
          {!hasKo && (
            <p className="text-label-sm text-ink-soft/70">한국어 번역 준비 중입니다.</p>
          )}

          <div className="mt-auto border-t border-line/60 pt-3">
            <button
              type="button"
              onClick={downloadProxy}
              disabled={proxyBusy}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3.5 py-2 text-label-md font-bold text-ink-soft transition hover:border-primary/40 hover:text-ink disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />
              {proxyBusy ? "만드는 중…" : "프록시 다운로드"}
            </button>
            <p className="mt-1.5 text-label-sm text-ink-soft/70">
              리프트바운드 규격(63×88mm · 300DPI) PNG. 실제 크기로 인쇄해 컷 가이드대로 자르세요.
            </p>
          </div>
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
