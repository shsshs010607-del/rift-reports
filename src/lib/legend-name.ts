/** 레전드 이름 정규화 — "Lee Sin - Blind Monk" / "Lee Sin, Blind Monk (Starter)" → "lee sin blind monk" */
export function normLegend(s: string): string {
  return s
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[,\-–]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
