import type { ResolvedDeck } from "@/lib/types/deck";
import type { Card } from "@/lib/types/card";

/**
 * 완성한 덱을 네이버 카페 등에 올리기 좋은 PNG 한 장으로 렌더한다.
 * 카드 이미지는 same-origin(/_next/image) 프록시로 불러와 캔버스가 오염되지 않게 한다.
 */

const FONT = '"Pretendard Variable", Pretendard, "Noto Sans KR", system-ui, sans-serif';

function proxied(src: string, w: number) {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75`;
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

const artOf = (c: Card) => c.localization.en.imageUrl ?? c.imageUrl ?? null;

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function renderDeckImage(
  rd: ResolvedDeck,
  opts: { deckName: string; code?: string | null; siteUrl?: string },
): Promise<Blob> {
  const W = 1400;
  const PAD = 44;
  const COLS = 10;
  const GAP = 12;
  const CW = Math.floor((W - PAD * 2 - GAP * (COLS - 1)) / COLS); // ~112
  const CH = Math.round(CW * 1.4); // 5:7

  const main = [...rd.sections.main].sort(
    (a, b) => (a.card.cost ?? 99) - (b.card.cost ?? 99) || a.card.name.localeCompare(b.card.name, "ko"),
  );
  const bf = rd.sections.battlefield;
  const rune = rd.sections.rune;

  const mainRows = Math.max(1, Math.ceil(main.length / COLS));
  const headerH = 108;
  const heroH = rd.legend || rd.champion ? CH + 78 : 0;
  const mainH = 44 + mainRows * (CH + 22) + 8;
  const extraH = bf.length || rune.length ? 44 + Math.round(CW * 0.72) + 40 : 0;
  const footerH = 64;
  const H = headerH + heroH + mainH + extraH + footerH + PAD;

  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);
  ctx.textBaseline = "top";

  // 배경
  ctx.fillStyle = "#fcf8ff";
  ctx.fillRect(0, 0, W, H);

  const counts = {
    main: main.reduce((s, e) => s + e.qty, 0),
    rune: rune.reduce((s, e) => s + e.qty, 0),
    bf: bf.reduce((s, e) => s + e.qty, 0),
  };

  // ── 헤더 ──
  ctx.fillStyle = "#4648d4";
  rr(ctx, PAD, PAD, W - PAD * 2, 64, 16);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 30px ${FONT}`;
  ctx.fillText(opts.deckName || "새 덱", PAD + 22, PAD + 15, W - PAD * 2 - 260);
  ctx.font = `700 18px ${FONT}`;
  ctx.textAlign = "right";
  ctx.fillText(
    `메인 ${counts.main} · 룬 ${counts.rune} · 전장 ${counts.bf}`,
    W - PAD - 22,
    PAD + 22,
  );
  ctx.textAlign = "left";

  let y = PAD + 64 + 20;

  // ── 레전드 · 챔피언 ──
  if (heroH) {
    ctx.fillStyle = "#181445";
    ctx.font = `800 20px ${FONT}`;
    ctx.fillText("레전드 · 리더 챔피언", PAD, y);
    y += 30;
    const heroes: { card: Card; label: string }[] = [];
    if (rd.legend) heroes.push({ card: rd.legend, label: "레전드" });
    if (rd.champion) heroes.push({ card: rd.champion, label: "챔피언" });
    const hw = CW * 1.7;
    for (let i = 0; i < heroes.length; i++) {
      const { card, label } = heroes[i];
      const x = PAD + i * (hw + 20);
      const src = artOf(card);
      if (src) {
        const img = await loadImg(src, 384);
        if (img) {
          ctx.save();
          rr(ctx, x, y, hw, CH, 12);
          ctx.clip();
          const ir = img.width / img.height;
          const dr = hw / CH;
          let sw = img.width,
            sh = img.height,
            sx = 0,
            sy = 0;
          if (ir > dr) {
            sw = img.height * dr;
            sx = (img.width - sw) / 2;
          } else {
            sh = img.width / dr;
            sy = 0;
          }
          ctx.drawImage(img, sx, sy, sw, sh, x, y, hw, CH);
          ctx.restore();
        }
      }
      ctx.strokeStyle = "#e3dfff";
      ctx.lineWidth = 2;
      rr(ctx, x, y, hw, CH, 12);
      ctx.stroke();
      ctx.fillStyle = "#464554";
      ctx.font = `700 15px ${FONT}`;
      ctx.fillText(label, x + 2, y + CH + 6);
      ctx.fillStyle = "#181445";
      ctx.font = `800 16px ${FONT}`;
      ctx.fillText(trim(ctx, card.name, hw), x + 2, y + CH + 26);
    }
    y += CH + 78;
  }

  // ── 메인덱 ──
  ctx.fillStyle = "#181445";
  ctx.font = `800 20px ${FONT}`;
  ctx.fillText(`메인덱 ${counts.main}`, PAD, y);
  y += 34;
  await drawGrid(ctx, main, PAD, y, CW, CH, COLS, GAP);
  y += mainRows * (CH + 22) + 10;

  // ── 전장 · 룬 ──
  if (extraH) {
    ctx.fillStyle = "#181445";
    ctx.font = `800 20px ${FONT}`;
    ctx.fillText(`전장 ${counts.bf} · 룬 ${counts.rune}`, PAD, y);
    y += 30;
    const lh = Math.round(CW * 0.72);
    let x = PAD;
    for (const e of [...bf, ...rune]) {
      const src = artOf(e.card);
      const isLand = e.card.orientation === "landscape";
      const w = isLand ? Math.round(lh * 1.6) : Math.round(lh / 1.4);
      if (src) {
        const img = await loadImg(src, 256);
        if (img) {
          ctx.save();
          rr(ctx, x, y, w, lh, 10);
          ctx.clip();
          coverDraw(ctx, img, x, y, w, lh);
          ctx.restore();
        }
      }
      ctx.strokeStyle = "#e3dfff";
      ctx.lineWidth = 2;
      rr(ctx, x, y, w, lh, 10);
      ctx.stroke();
      badge(ctx, x + w - 6, y + 6, `×${e.qty}`);
      x += w + GAP;
      if (x > W - PAD - 80) {
        x = PAD;
        y += lh + 12;
      }
    }
    y += lh + 24;
  }

  // ── 푸터 ──
  ctx.fillStyle = "#464554";
  ctx.font = `600 15px ${FONT}`;
  if (opts.code) ctx.fillText(`덱 코드  ${opts.code}`, PAD, H - PAD - 8);
  ctx.textAlign = "right";
  ctx.fillStyle = "#4648d4";
  ctx.font = `800 16px ${FONT}`;
  ctx.fillText(`리바지지 · ${opts.siteUrl ?? "riba.gg"}`, W - PAD, H - PAD - 8);
  ctx.textAlign = "left";

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob 실패"))), "image/png");
  });
}

async function drawGrid(
  ctx: CanvasRenderingContext2D,
  items: { card: Card; qty: number }[],
  x0: number,
  y0: number,
  cw: number,
  ch: number,
  cols: number,
  gap: number,
) {
  for (let i = 0; i < items.length; i++) {
    const { card, qty } = items[i];
    const cx = x0 + (i % cols) * (cw + gap);
    const cy = y0 + Math.floor(i / cols) * (ch + 22);
    const src = artOf(card);
    if (src) {
      const img = await loadImg(src, 256);
      if (img) {
        ctx.save();
        rr(ctx, cx, cy, cw, ch, 8);
        ctx.clip();
        coverDrawTop(ctx, img, cx, cy, cw, ch);
        ctx.restore();
      }
    }
    ctx.strokeStyle = "#e3dfff";
    ctx.lineWidth = 1.5;
    rr(ctx, cx, cy, cw, ch, 8);
    ctx.stroke();
    if (typeof card.cost === "number") {
      ctx.fillStyle = "rgba(24,20,69,0.9)";
      ctx.beginPath();
      ctx.arc(cx + 13, cy + 13, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "800 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(card.cost), cx + 13, cy + 6);
      ctx.textAlign = "left";
    }
    badge(ctx, cx + cw - 4, cy + 4, `×${qty}`);
    ctx.fillStyle = "#181445";
    ctx.font = `600 11px ${FONT}`;
    ctx.fillText(trim(ctx, card.name, cw + 6), cx, cy + ch + 4);
  }
}

function badge(ctx: CanvasRenderingContext2D, right: number, top: number, text: string) {
  ctx.font = "800 13px sans-serif";
  const w = ctx.measureText(text).width + 10;
  ctx.fillStyle = "#4648d4";
  rr(ctx, right - w, top, w, 20, 6);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.fillText(text, right - w / 2, top + 3);
  ctx.textAlign = "left";
}

function coverDraw(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const ir = img.width / img.height;
  const dr = w / h;
  let sw = img.width,
    sh = img.height,
    sx = 0,
    sy = 0;
  if (ir > dr) {
    sw = img.height * dr;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / dr;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/** 세로 카드에서 위쪽(아트)만 크롭 */
function coverDrawTop(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const dr = w / h;
  let sw = img.width;
  let sh = img.width / dr;
  if (sh > img.height) {
    sh = img.height;
    sw = img.height * dr;
  }
  const sx = (img.width - sw) / 2;
  ctx.drawImage(img, sx, Math.round(img.height * 0.06), sw, sh, x, y, w, h);
}

function trim(ctx: CanvasRenderingContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > max) t = t.slice(0, -1);
  return t + "…";
}
