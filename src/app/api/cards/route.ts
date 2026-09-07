import { NextResponse } from "next/server";
import { z } from "zod";

import { getCardService, CardServiceError } from "@/lib/services/cardService";
import {
  CARD_DOMAIN_SLUGS,
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

// 카드 데이터는 빌드타임에 알 수 없으므로 요청 시 처리.
export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  domain: z.enum(CARD_DOMAIN_SLUGS as unknown as [string, ...string[]]).optional(),
  type: z.enum(CARD_TYPE_SLUGS as unknown as [string, ...string[]]).optional(),
  rarity: z.enum(CARD_RARITY_SLUGS as unknown as [string, ...string[]]).optional(),
  cost: z.coerce.number().int().min(0).max(30).optional(),
  setCode: z
    .string()
    .trim()
    .toUpperCase()
    .pipe(z.enum(CARD_SET_CODES as unknown as [string, ...string[]]))
    .optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
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
    const cards = await service.searchCards(parsed.data as CardSearchQuery);
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
