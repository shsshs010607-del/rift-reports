import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Vercel이 프로젝트마다 자동으로 붙여주는 기본 도메인은 riba.gg와 완전히 같은
 * 사이트를 그대로 보여준다 — 검색엔진 중복 색인, 잘못 공유된 링크 등을 막기 위해
 * 정식 도메인으로 리다이렉트한다. 프리뷰 배포(브랜치별 *-git-*.vercel.app)는
 * 건드리지 않는다 — 그건 계속 미리보기로 써야 하니까.
 */
const REDIRECT_HOSTS = new Set(["rift-reports.vercel.app"]);
const CANONICAL_HOST = "riba.gg";

export async function proxy(request: NextRequest) {
  if (REDIRECT_HOSTS.has(request.nextUrl.hostname)) {
    const url = request.nextUrl.clone();
    url.protocol = "https";
    url.hostname = CANONICAL_HOST;
    url.port = "";
    return NextResponse.redirect(url, 308);
  }
  const res = await updateSession(request);
  // TEMP debug: confirm proxy is executing in prod
  res.headers.set("x-proxy-debug", `host=${request.nextUrl.hostname}`);
  return res;
}

export const config = {
  matcher: [
    /*
     * 아래를 제외한 모든 경로에 적용:
     * _next/static, _next/image, favicon, 이미지 파일,
     * 인증 불필요 + 캐시 가능한 공개 API(api/cards, api/card-image)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/cards|api/card-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
