"use server";

import { createPublicClient } from "@/lib/supabase/public";

/** 8자 base36(0-9a-z) — 36^8 ≈ 2.8조 경우의 수, 이 규모 사이트에서 충돌 걱정 없음. */
function randomShareId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => (b % 36).toString(36)).join("");
}

/**
 * 덱 코드를 저장하고 짧은 id(riba.gg/d/<id>)를 발급한다.
 * 로그인 불필요 — 덱 시뮬레이터는 비로그인으로도 쓰는 사람이 많다.
 * 같은 코드가 이미 있으면 기존 id 를 재사용해 레코드가 불필요하게 늘지 않게 한다.
 */
export async function createDeckShare(code: string): Promise<{ id: string } | { error: string }> {
  const trimmed = code.trim();
  if (!trimmed) return { error: "빈 덱은 공유할 수 없어요" };
  if (trimmed.length > 500) return { error: "덱 코드가 너무 깁니다" };

  const supabase = createPublicClient();

  const { data: existing } = await supabase
    .from("deck_shares")
    .select("id")
    .eq("code", trimmed)
    .limit(1)
    .maybeSingle();
  if (existing) return { id: existing.id };

  for (let attempt = 0; attempt < 5; attempt++) {
    const id = randomShareId();
    const { error } = await supabase.from("deck_shares").insert({ id, code: trimmed });
    if (!error) return { id };
    if (error.code !== "23505") return { error: error.message }; // 23505 = id 충돌, 재시도
  }
  return { error: "공유 링크 생성에 실패했어요" };
}

/** /d/[id] 리다이렉트용 — 공개 데이터라 짧게 캐시해도 무방. */
export async function getDeckShareCode(id: string): Promise<string | null> {
  if (!/^[a-z0-9]{6,10}$/.test(id)) return null;
  const supabase = createPublicClient();
  const { data } = await supabase.from("deck_shares").select("code").eq("id", id).maybeSingle();
  return data?.code ?? null;
}
