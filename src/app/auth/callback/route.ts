import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth / 매직 링크 콜백.
 * code 를 세션으로 교환하고, 닉네임 미설정이면 /onboarding 으로 보낸다.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/";
  // 보안: 오픈 리다이렉트 방지 — 내부 절대경로만 허용
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const userId = data.user?.id;
      if (userId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarded")
          .eq("id", userId)
          .maybeSingle();
        if (profile && !profile.onboarded) {
          const to = `/onboarding${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`;
          return NextResponse.redirect(`${origin}${to}`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
