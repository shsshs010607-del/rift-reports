import type { Card, Locale } from "@/lib/types/card";

/**
 * 카드 1장을 인쇄용 프록시 PNG 로 렌더한다 (리프트바운드 표준 규격).
 *  - 세로 카드: 63 × 88 mm, 가로(전장) 카드: 88 × 63 mm
 *  - 300 DPI · 사방 2 mm 블리드 + 모서리 컷 가이드
 *  - 카드 이미지는 same-origin(/_next/image) 프록시로 불러와 캔버스 오염 방지
 */

const DPI = 300;
const PX_PER_MM = DPI / 25.4;
const CARD_SHORT_MM = 63;
const CARD_LONG_MM = 88;
const BLEED_MM = 2;

function proxied(src: string, w: number) {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=90`;
}

function loadImg(src: string, w: number): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = proxied(src, w);
  });
}

const mm = (v: number) => Math.round(v * PX_PER_MM);

export async function renderProxyImage(card: Card, locale: Locale = "ko"): Promise<Blob> {
  const landscape = card.orientation === "landscape";
  const cardWmm = landscape ? CARD_LONG_MM : CARD_SHORT_MM;
  const cardHmm = landscape ? CARD_SHORT_MM : CARD_LONG_MM;

  const cardW = mm(cardWmm);
  const cardH = mm(cardHmm);
  const bleed = mm(BLEED_MM);
  const W = cardW + bleed * 2;
  const H = cardH + bleed * 2;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context 없음");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  const src =
    (locale === "ko" ? card.localization.ko?.imageUrl : null) ??
    card.localization.en.imageUrl ??
    card.imageUrl ??
    null;
  const img = src ? await loadImg(src, landscape ? 1400 : 1024) : null;

  ctx.save();
  ctx.beginPath();
  ctx.rect(bleed, bleed, cardW, cardH);
  ctx.clip();
  if (img) {
    const s = Math.max(cardW / img.width, cardH / img.height);
    const dw = img.width * s;
    const dh = img.height * s;
    ctx.drawImage(img, bleed + (cardW - dw) / 2, bleed + (cardH - dh) / 2, dw, dh);
  } else {
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(bleed, bleed, cardW, cardH);
    ctx.fillStyle = "#111827";
    ctx.font = "bold 40px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(card.name, W / 2, H / 2);
  }
  ctx.restore();

  // ── 모서리 컷 가이드 (블리드 영역에 L자) ──
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 2;
  const tick = mm(BLEED_MM);
  const corners: [number, number, number, number][] = [
    [bleed, bleed, -1, -1],
    [bleed + cardW, bleed, 1, -1],
    [bleed, bleed + cardH, -1, 1],
    [bleed + cardW, bleed + cardH, 1, 1],
  ];
  for (const [x, y, sx, sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(x + sx * tick, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + sy * tick);
    ctx.stroke();
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob 실패"))),
      "image/png",
    );
  });
}

/** 다운로드 파일명 (안전 문자만). */
export function proxyFileName(card: Card): string {
  const num = card.setCode && card.collectorNumber
    ? `${card.setCode}-${String(card.collectorNumber).replace(/\D+/g, "").padStart(3, "0")}`
    : card.setCode || "card";
  const name = card.name.replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, "_").slice(0, 40);
  return `proxy_${num}_${name}.png`;
}
