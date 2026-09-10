import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * service_role 키를 쓰는 관리자 클라이언트 — RLS 를 우회한다.
 * **서버 액션에서 운영진 확인(requireStaff) 후에만** 사용할 것.
 * 스크립트가 채우고 RLS 로 일반 쓰기를 막아둔 테이블(meta_decks 등) 관리용.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY 미설정 — 관리자 작업 불가");
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}
