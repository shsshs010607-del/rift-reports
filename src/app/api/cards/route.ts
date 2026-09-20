import { NextResponse } from "next/server";
import { z } from "zod";

import { getCardService, CardServiceError } from "@/lib/services/cardService";
import {
  CARD_DOMAIN_FILTER_SLUGS,
  CARD_RARITY_SLUGS,
  CARD_SET_CODES,
  CARD_TYPE_SLUGS,
  type CardSearchQuery,
} from "@/lib/types/card";

/**
 * GET /api/cards — 카드 검색/목록 (어댑터 계층 사용 예시).
 *
 * 쿼리스트링(모두 선택):
 *   q       자유 텍스트 (카드명 + 룰 텍스트, 한/영)
 *   domain  fury | calm | mind | body | chaos | order
 *   type    champion | unit | spell | gear | rune | battlefield | legend
 *   rarity  common | uncommon | rare | epic | overnumbered | promo | showcase
 *   cost    정수
 *   setCode 확장팩 코드 (OGN | OGS | SFD | UNL | VEN | OPP | PR | JDG)
 *   limit / offset  페이지네이션
 *
 * 데이터 소스는 NEXT_PUBLIC_DATA_SOURCE 로 결정된다(라우트 코드는 무관).
 */

// request.url(쿼리스트링)을 읽으므로 이미 요청 시 처리된다.
// (force-dynamic 을 두면 카드 서비스의 fetch 캐시까지 꺼지므로 넣지 않는다.)

/** "a,b" 형태의 쉼표 목록 → 허용값만 담긴 배열 (값이 하나여도 그대로 동작). */
const list = (allowed: readonly string[], upper = false) =>
  z
    .string()
    .transform((s) => s.split(",").map((v) => (upper ? v.trim().toUpperCase() : v.trim())).filter(Boolean))
    .pipe(z.array(z.enum(allowed as unknown as [string, ...string[]])).min(1));

const QuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  domain: list(CARD_DOMAIN_FILTER_SLUGS).optional(),
  type: list(CARD_TYPE_SLUGS).optional(),
  rarity: list(CARD_RARITY_SLUGS).optional(),
  cost: z
    .string()
    .transform((s) => s.split(",").map((v) => Number(v.trim())))
    .pipe(z.array(z.number().int().min(0).max(30)).min(1))
    .optional(),
  setCode: list(CARD_SET_CODES, true).optional(),
  limit: z.coerce.number().int().min(1).max(2000).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);

  const parsed = QuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "잘못된 검색 파라미터입니다.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const service = getCardService();
    // 덱 빌더 등 클라이언트에서 영역으로 좁혀도 무색(전장 등) 카드는 항상 포함한다.
    const cards = await service.searchCards({
      ...parsed.data,
      colorlessOk: true,
    } as CardSearchQuery);
    return NextResponse.json(
      { count: cards.length, cards },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch (err) {
    if (err instanceof CardServiceError) {
      console.error("[api/cards]", err.message, err.cause ?? "");
      return NextResponse.json(
        { error: "카드 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." },
        { status: 503 },
      );
    }
    console.error("[api/cards] 예상치 못한 오류:", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
