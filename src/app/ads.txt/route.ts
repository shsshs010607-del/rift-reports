import { ADSENSE } from "@/lib/constants";

/**
 * AdSense ads.txt — NEXT_PUBLIC_ADSENSE_CLIENT 로부터 자동 생성.
 * 예) ca-pub-1234567890123456  →  "google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0"
 */
export const dynamic = "force-static";

export function GET() {
  if (!ADSENSE.client) {
    return new Response("Not configured\n", { status: 404 });
  }
  const pub = ADSENSE.client.replace(/^ca-/, "");
  return new Response(`google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
