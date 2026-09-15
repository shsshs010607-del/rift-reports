import type { MbtiType } from "@/lib/data/deck-quiz";

/**
 * "내 MBTI 덱 찾기" 결과를 인스타그램 피드 규격(1080×1350, 4:5)의 PNG 한 장으로 렌더한다.
 * 카드 아트는 same-origin(/_next/image) 프록시로 불러와 캔버스가 오염되지 않게 한다.
 */

const FONT = '"Pretendard Variable", Pretendard, "Noto Sans KR", system-ui, sans-serif';

export type QuizImageTheme = "violet" | "gold" | "midnight";

const THEMES: Record<QuizImageTheme, { bg: [string, string]; accent: string; glow: string }> = {
  violet: { bg: ["#2a1f6b", "#0d0a24"], accent: "#c9b8ff", glow: "rgba(148,110,255,0.35)" },
  gold: { bg: ["#5a3a12", "#1a1006"], accent: "#ffd98a", glow: "rgba(255,184,77,0.3)" },
  midnight: { bg: ["#0f2436", "#020608"], accent: "#8fe3ff", glow: "rgba(70,180,255,0.28)" },
};

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

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function centerText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  maxWidth?: number,
) {
  ctx.textAlign = "center";
  ctx.fillText(text, cx, y, maxWidth);
  ctx.textAlign = "left";
}

export async function renderQuizResultImage(opts: {
  type: MbtiType;
  deckName: string;
  deckArt: string | null;
  theme: QuizImageTheme;
  siteUrl?: string;
}): Promise<Blob> {
  const W = 1080;
  const H = 1350;
  const scale = 1; // 이미 1080 기준 — 추가 확대 불필요(파일 용량 고려)
  const t = THEMES[opts.theme];

  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);
  ctx.textBaseline = "alphabetic";

  // ── 배경 그라디언트 ──
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, t.bg[0]);
  bg.addColorStop(1, t.bg[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 은은한 글로우 두 개 (장식)
  for (const [gx, gy, gr] of [
    [W * 0.15, H * 0.1, 420],
    [W * 0.9, H * 0.85, 380],
  ] as const) {
    const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
    glow.addColorStop(0, t.glow);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
  }

  // ── 상단 워드마크 ──
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = `800 30px ${FONT}`;
  centerText(ctx, "RIBA.GG", W / 2, 96);
  ctx.fillStyle = t.accent;
  ctx.font = `700 22px ${FONT}`;
  centerText(ctx, "내 MBTI 덱 찾기", W / 2, 132);

  // ── MBTI 코드 (크게) ──
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 132px ${FONT}`;
  centerText(ctx, opts.type.code, W / 2, 300);

  // ── 별명 ──
  ctx.fillStyle = t.accent;
  ctx.font = `800 40px ${FONT}`;
  centerText(ctx, opts.type.nickname, W / 2, 358, W - 120);

  // ── 카드 아트 (폴라로이드) ──
  const cardW = 420;
  const cardH = Math.round(cardW * (1039 / 744));
  const cardX = (W - cardW) / 2;
  const cardY = 410;
  const frameR = 20;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = "#ffffff";
  rr(ctx, cardX - 14, cardY - 14, cardW + 28, cardH + 70, frameR);
  ctx.fill();
  ctx.restore();

  if (opts.deckArt) {
    const img = await loadImg(opts.deckArt, 640);
    if (img) {
      ctx.save();
      rr(ctx, cardX, cardY, cardW, cardH, 8);
      ctx.clip();
      const ir = img.width / img.height;
      const dr = cardW / cardH;
      let sw = img.width,
        sh = img.height,
        sx = 0,
        sy = 0;
      if (ir > dr) {
        sw = img.height * dr;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / dr;
      }
      ctx.drawImage(img, sx, sy, sw, sh, cardX, cardY, cardW, cardH);
      ctx.restore();
    }
  }
  ctx.fillStyle = "#1a1a1a";
  ctx.font = `800 30px ${FONT}`;
  centerText(ctx, opts.deckName, W / 2, cardY + cardH + 42);

  // ── 해시태그 ──
  const tagY = cardY + cardH + 108;
  ctx.font = `700 28px ${FONT}`;
  const tags = [...opts.type.hashtags, `#${opts.type.code}`];
  const gap = 18;
  const widths = tags.map((tg) => ctx.measureText(tg).width);
  const totalW = widths.reduce((a, b) => a + b, 0) + gap * (tags.length - 1);
  let tx = (W - totalW) / 2;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  tags.forEach((tg, i) => {
    ctx.fillText(tg, tx, tagY);
    tx += widths[i] + gap;
  });

  // ── 이벤트 안내 배지 ──
  const badgeY = H - 190;
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  rr(ctx, 90, badgeY, W - 180, 92, 22);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 26px ${FONT}`;
  centerText(ctx, "이 사진 공유하고 카페 가입하면 카드 증정 🎁", W / 2, badgeY + 40);
  ctx.fillStyle = t.accent;
  ctx.font = `700 22px ${FONT}`;
  centerText(ctx, "#리바지지MBTI덱", W / 2, badgeY + 72);

  // ── 푸터 ──
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = `700 24px ${FONT}`;
  centerText(ctx, opts.siteUrl ?? "riba.gg", W / 2, H - 48);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob 실패"))), "image/png");
  });
}
