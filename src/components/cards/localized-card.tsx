import Image from "next/image";

import type { Card } from "@/lib/types/card";
import { CARD_DOMAINS } from "@/lib/constants";

const DOMAIN_COLOR = new Map(CARD_DOMAINS.map((d) => [d.slug, d.color]));

/**
 * 세로(portrait) 리프트바운드 카드 프레임 기준 영역 — 카드 높이/너비 대비 %.
 * 리프트나루 한글판 이미지의 텍스트 위치를 참고해 잡았다. 카드마다 미세하게 다를 수 있음.
 */
const FRAME = {
  name: { top: "57.2%", height: "9.2%", insetL: "8.5%", insetR: "6%" },
  textbox: { top: "66.6%", bottom: "3.6%", inset: "7%" },
};

/**
 * 고화질 영문 공식 이미지 위에 한글 번역(이름·룰텍스트)을 얹어 "한글 번역 카드"를 렌더.
 * - 번역이 없거나 가로(landscape) 카드면 영문 이미지를 그대로 보여준다.
 * - 컨테이너 폭에 맞춰 폰트가 스케일된다(container query). 부모가 크기를 정한다.
 */
export function LocalizedCard({
  card,
  className,
  sizes = "320px",
  priority,
}: {
  card: Card;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const img = card.localization.en.imageUrl ?? card.imageUrl;
  const ko = card.localization.ko;
  const showOverlay = Boolean(ko && card.orientation === "portrait" && img);

  const banner =
    card.domains.length === 0
      ? "#39323b"
      : card.domains.length === 1
        ? (DOMAIN_COLOR.get(card.domains[0]) ?? "#39323b")
        : `linear-gradient(95deg, ${card.domains
            .map((d) => DOMAIN_COLOR.get(d) ?? "#777")
            .join(", ")})`;

  return (
    <div
      className={`relative aspect-[744/1039] overflow-hidden rounded-[4.5%] bg-subcanvas ${className ?? ""}`}
      style={{ containerType: "inline-size" }}
    >
      {img ? (
        <Image
          src={img}
          alt={card.localization.en.name}
          fill
          sizes={sizes}
          className="object-cover"
          priority={priority}
        />
      ) : (
        <div className="grid h-full place-items-center p-4 text-center text-title-md text-ink-soft">
          {card.name}
        </div>
      )}

      {showOverlay && ko && (
        <>
          {/* 이름 배너 */}
          <div
            className="absolute flex items-center"
            style={{
              top: FRAME.name.top,
              height: FRAME.name.height,
              left: FRAME.name.insetL,
              right: FRAME.name.insetR,
              background: banner,
              paddingInline: "2%",
            }}
          >
            <span
              className="w-full truncate font-extrabold leading-none text-white"
              style={{ fontSize: "clamp(8px, 4.6cqw, 30px)", textShadow: "0 1px 2px rgba(0,0,0,.45)" }}
            >
              {ko.name}
            </span>
          </div>

          {/* 룰 텍스트 상자 */}
          <div
            className="absolute overflow-hidden"
            style={{
              top: FRAME.textbox.top,
              bottom: FRAME.textbox.bottom,
              left: FRAME.textbox.inset,
              right: FRAME.textbox.inset,
              background: "#f6f1e3",
              borderRadius: "1.5%",
              padding: "3% 3.5%",
            }}
          >
            <p
              className="whitespace-pre-line font-medium leading-snug text-[#2b2016]"
              style={{ fontSize: "clamp(5px, 2.9cqw, 15px)" }}
            >
              {renderRules(ko.text)}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/** `[키워드]` 는 굵게. 나머지는 그대로. */
function renderRules(text: string) {
  return text.split(/(\[[^\]]+\])/g).map((part, i) =>
    part.startsWith("[") && part.endsWith("]") ? (
      <strong key={i} className="font-bold text-[#1b6b3a]">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}
