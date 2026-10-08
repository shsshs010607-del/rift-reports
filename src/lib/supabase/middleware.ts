import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database";

/** 이 시간(일반 커뮤니티 기준 7일) 동안 사이트에 한 번도 안 들어오면 로그인이 풀린다. 기간을 바꾸려면 이 값만 고치면 된다. */
const IDLE_LOGOUT_MS = 7 * 24 * 60 * 60 * 1000;
/** 마지막 접속 시각 쿠키 — 요청마다 쓰지 않고 이 간격이 지났을 때만 갱신한다. */
const LAST_SEEN_COOKIE = "riba-last-seen";
const LAST_SEEN_REFRESH_MS = 5 * 60 * 1000;

/** 요청마다 Supabase 세션 쿠키를 갱신한다. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // 환경변수 미설정(설치 직후) 시 인증 없이 통과 — 사이트는 로그아웃 상태로 동작
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response;
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() 호출로 만료 토큰을 갱신한다. 이 라인 제거 금지.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 미사용 자동 로그아웃 — Supabase 세션은 갱신 토큰 덕에 사실상 영구 유지돼서, 사이트를 오래 안 쓴 사람도
  // 계속 로그인 상태였다. 마지막 접속 시각을 쿠키로 남기고, IDLE_LOGOUT_MS 넘게 비우면 이 기기만 로그아웃한다.
  const now = Date.now();
  const lastSeen = Number(request.cookies.get(LAST_SEEN_COOKIE)?.value);
  if (!user) {
    if (request.cookies.has(LAST_SEEN_COOKIE)) response.cookies.delete(LAST_SEEN_COOKIE);
  } else if (lastSeen && now - lastSeen > IDLE_LOGOUT_MS) {
    await supabase.auth.signOut({ scope: "local" }); // global 이면 다른 기기까지 전부 로그아웃되므로 local
    response.cookies.delete(LAST_SEEN_COOKIE);
  } else if (!lastSeen || now - lastSeen > LAST_SEEN_REFRESH_MS) {
    response.cookies.set(LAST_SEEN_COOKIE, String(now), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return response;
}
