/** 스크립트 공용: env 로딩 + service_role Supabase 클라이언트. */
import { existsSync, readFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/types/database";

/** CI 에선 process.env, 로컬에선 .env.local 파일에서 채운다. */
export function loadEnv() {
  const file = new URL("../.env.local", import.meta.url);
  if (existsSync(file)) {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`환경변수 ${name} 가 없습니다 (.env.local 또는 CI secret).`);
    process.exit(1);
  }
  return v;
}

export function supabaseAdmin(): SupabaseClient<Database> {
  return createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );
}
