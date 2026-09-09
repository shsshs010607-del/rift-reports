/**
 * GET /api/card-image?url=<remote card image>
 *
 * 카드 이미지를 same-origin 으로 중계한다. 프록시 출력(캔버스 → PNG)에서
 * `/_next/image` 는 허용 폭 제한(400)·Vercel 최적화 쿼터 때문에 쓰지 않는다.
 * 허용된 CDN 호스트만 통과. 캔버스 오염 방지를 위해 ACAO 를 붙인다.
 */

const ALLOWED_HOSTS = new Set([
  "cmsassets.rgpub.io",
  "tcgplayer-cdn.tcgplayer.com",
  "product-images.tcgplayer.com",
]);

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("url");
  if (!raw) return new Response("missing url", { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response("bad url", { status: 400 });
  }
  if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname)) {
    return new Response("host not allowed", { status: 403 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), {
      headers: { accept: "image/avif,image/webp,image/png,image/*" },
      cache: "no-store",
    });
  } catch {
    return new Response("upstream fetch failed", { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    return new Response(`upstream ${upstream.status}`, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "image/png";
  if (!contentType.startsWith("image/")) {
    return new Response("not an image", { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=86400, s-maxage=604800",
      "access-control-allow-origin": "*",
    },
  });
}
