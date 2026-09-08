/**
 * 한국 스탠다드 금지(밴) 카드 목록.
 *
 * card_id (Card.id, 예: Riftcodex id "ogn-001") 를 추가하면:
 *  - 카드 이미지에 "밴" 배지가 붙고
 *  - 태그 목록에 "밴" 이 추가되어 검색/필터로 잡힌다 (/cards?q=밴)
 *
 * 공식 금지 리스트가 확정되면 여기 채운다. 지금은 비어 있음.
 */
export const BANNED_CARD_IDS: ReadonlySet<string> = new Set<string>([
  // "ogn-123",
]);

/** 밴 카드 태그 라벨 (subtypes 에 주입 + 필터). */
export const BAN_TAG = "밴";

export function isBanned(id: string | null | undefined): boolean {
  return id != null && BANNED_CARD_IDS.has(id);
}
