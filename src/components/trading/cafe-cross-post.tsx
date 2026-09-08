"use client";

import { useMemo, useState } from "react";
import { Check, Copy, ChevronDown } from "lucide-react";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** N 아이콘 */
function NaverIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845Z" />
    </svg>
  );
}

export function CafeCrossPost({
  title,
  categoryLabel,
  priceText,
  conditionLabel,
  region,
  description,
  permalink,
}: {
  title: string;
  categoryLabel: string;
  priceText: string;
  conditionLabel?: string | null;
  region?: string | null;
  description?: string | null;
  permalink: string;
}) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const cafeReady = SITE.naverCafe && SITE.naverCafe !== "#";
  const writeUrl = SITE.naverCafeTradeWrite || SITE.naverCafeTrade || SITE.naverCafe;

  const bodyText = useMemo(() => {
    const lines = [
      `[${categoryLabel}] ${title}`,
      "",
      `가격: ${priceText}`,
    ];
    if (conditionLabel) lines.push(`카드 상태: ${conditionLabel}`);
    if (region) lines.push(`지역: ${region}`);
    if (description?.trim()) {
      lines.push("", description.trim());
    }
    lines.push(
      "",
      "────────",
      `※ 리프트 리포트 트레이딩에 올린 글입니다`,
      permalink,
    );
    return lines.join("\n");
  }, [title, categoryLabel, priceText, conditionLabel, region, description, permalink]);

  if (!cafeReady) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(bodyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setOpen(true); // 클립보드 막히면 아래 텍스트 직접 복사하도록 펼침
    }
  }

  async function copyAndOpen() {
    await copy();
    window.open(writeUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mt-4 rounded-2xl border border-[#03C75A]/30 bg-[#03C75A]/[0.07] p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#03C75A] text-white">
          <NaverIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-body-md font-bold text-ink">네이버 카페에도 올리기</p>
          <p className="mt-0.5 text-body-sm text-ink-soft">
            글 내용을 복사하고 카드 판매 게시판 글쓰기 창을 엽니다. 카페에서 붙여넣기(Ctrl+V)만
            하면 돼요.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyAndOpen}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#03C75A] px-4 py-2 text-label-md font-bold text-white transition hover:brightness-95"
            >
              {copied ? <Check className="h-4 w-4" /> : <NaverIcon className="h-3.5 w-3.5" />}
              {copied ? "복사됨 · 카페 창 열림" : "복사하고 카페 글쓰기 열기"}
            </button>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3.5 py-2 text-label-md font-bold text-ink-soft transition hover:text-ink"
            >
              <Copy className="h-3.5 w-3.5" />
              내용만 복사
            </button>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mt-2.5 inline-flex items-center gap-1 text-body-sm font-bold text-ink-soft hover:text-ink"
          >
            <ChevronDown className={cn("h-3.5 w-3.5 transition", open && "rotate-180")} />
            복사될 내용 {open ? "접기" : "미리보기"}
          </button>
          {open && (
            <textarea
              readOnly
              value={bodyText}
              rows={Math.min(14, bodyText.split("\n").length + 1)}
              onFocus={(e) => e.currentTarget.select()}
              className="mt-2 w-full resize-y rounded-xl border border-line bg-card p-3 font-mono text-[12.5px] leading-relaxed text-ink"
            />
          )}
        </div>
      </div>
    </div>
  );
}
