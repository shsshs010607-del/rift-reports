import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
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
