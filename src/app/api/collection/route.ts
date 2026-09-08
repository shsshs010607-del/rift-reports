import { NextResponse } from "next/server";

import { getMyCollection } from "@/lib/collection";

/**
 * GET /api/collection — 로그인 유저의 보유 카드 수량 맵.
 * 응답: { "<cardId>": <qty>, ... }  (비로그인·테이블 없음이면 {})
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const items = await getMyCollection();
  const map: Record<string, number> = {};
  for (const it of items) map[it.card_id] = it.quantity;
  return NextResponse.json(map, {
    headers: { "cache-control": "private, no-store" },
  });
}
