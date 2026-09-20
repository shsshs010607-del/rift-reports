import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * 쿠키를 읽지 않는 익명(anon) 클라이언트 — 로그인 여부와 무관한 "공개 데이터" 조회 전용.
 *
 * `@/lib/supabase/server` 의 createClient 는 cookies() 를 호출해서, 이걸 쓰는 페이지는
 * `revalidate` 를 지정해도 전부 요청마다 새로 렌더링(no-store)된다. 공개 읽기(RLS "공개 읽기"
 * 정책이 있는 테이블)는 이 클라이언트를 써야 ISR/CDN 캐시가 실제로 동작한다.
 * 스태프 미리보기(초안 등)·본인 데이터처럼 세션이 필요한 조회에는 쓰지 말 것.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase 환경변수 미설정");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
