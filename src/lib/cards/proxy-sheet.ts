import type { Card, Locale } from "@/lib/types/card";

/**
 * 여러 카드를 A4 인쇄 시트 PNG(들)로 렌더한다.
 *  - A4 210×297mm @ 300DPI, 카드 63×88mm, 3열 × 3행 = 페이지당 9장
 *  - 카드 사이 컷 가이드 라인, same-origin(/_next/image) 프록시로 캔버스 오염 방지
 */

const DPI = 300;
const MM = DPI / 25.4;
const PAGE_W = Math.round(210 * MM);
const PAGE_H = Math.round(297 * MM);
const CARD_W = Math.round(63 * MM);
const CARD_H = Math.round(88 * MM);
const COLS = 3;
const ROWS = 3;
const PER_PAGE = COLS * ROWS;
const GRID_W = CARD_W * COLS;
const GRID_H = CARD_H * ROWS;
const OX = Math.round((PAGE_W - GRID_W) / 2);
const OY = Math.round((PAGE_H - GRID_H) / 2);

function proxied(src: string, w: number) {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=90`;
}

function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = proxied(src, 1024);
  });
}

const artOf = (c: Card, locale: Locale) =>
  (locale === "ko" ? c.localization.ko?.imageUrl : null) ??
  c.localization.en.imageUrl ??
  c.imageUrl ??
  null;

export type ProxyEntry = { card: Card; qty: number };

export async function renderProxySheets(
  entries: ProxyEntry[],
  locale: Locale = "ko",
): Promise<Blob[]> {
  // 카드를 수량만큼 펼친다
  const flat: Card[] = [];
  for (const e of entries) for (let i = 0; i < Math.max(1, e.qty); i++) flat.push(e.card);
  if (flat.length === 0) return [];

  // 필요한 아트를 미리 로드 (중복 제거)
  const uniq = new Map<string, Promise<HTMLImageElement | null>>();
  for (const c of flat) {
    const src = artOf(c, locale);
    if (src && !uniq.has(src)) uniq.set(src, loadImg(src));
  }
  const imgBySrc = new Map<string, HTMLImageElement | null>();
  await Promise.all([...uniq.entries()].map(async ([s, p]) => imgBySrc.set(s, await p)));

  const pages = Math.ceil(flat.length / PER_PAGE);
  const blobs: Blob[] = [];

  for (let p = 0; p < pages; p++) {
    const canvas = document.createElement("canvas");
    canvas.width = PAGE_W;
    canvas.height = PAGE_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2d context 없음");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    const slice = flat.slice(p * PER_PAGE, p * PER_PAGE + PER_PAGE);
    slice.forEach((card, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = OX + col * CARD_W;
      const y = OY + row * CARD_H;

      const src = artOf(card, locale);
      const img = src ? imgBySrc.get(src) : null;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, CARD_W, CARD_H);
      ctx.clip();
      if (img) {
        const s = Math.max(CARD_W / img.width, CARD_H / img.height);
        const dw = img.width * s;
        const dh = img.height * s;
        ctx.drawImage(img, x + (CARD_W - dw) / 2, y + (CARD_H - dh) / 2, dw, dh);
      } else {
        ctx.fillStyle = "#e5e7eb";
        ctx.fillRect(x, y, CARD_W, CARD_H);
        ctx.fillStyle = "#111827";
        ctx.font = "bold 28px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(card.name, x + CARD_W / 2, y + CARD_H / 2);
      }
      ctx.restore();
    });

    // 컷 가이드 (그리드 경계선을 종이 끝까지 연장)
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) {
      const gx = OX + c * CARD_W;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, PAGE_H);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      const gy = OY + r * CARD_H;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(PAGE_W, gy);
      ctx.stroke();
    }

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob 실패"))), "image/png");
    });
    blobs.push(blob);
  }

  return blobs;
}
