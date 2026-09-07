import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { NicknameForm } from "@/components/auth/nickname-form";

export const metadata: Metadata = { title: "닉네임 설정" };

const safeNext = (raw: string) => (raw.startsWith("/") && !raw.startsWith("//") ? raw : "/");

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  if (!hasSupabaseEnv) redirect("/login");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/onboarding");

  const next = safeNext(searchParams.next ?? "/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.onboarded) redirect(next);

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const suggestion = String(
    meta.name || meta.full_name || meta.user_name || meta.preferred_username || meta.nickname || "",
  )
    .replace(/[^가-힣a-zA-Z0-9_-]/g, "")
    .slice(0, 20);

  return (
    <div className="mx-auto max-w-md py-8">
      <h1 className="text-center font-display text-headline-md text-ink">닉네임 설정</h1>
      <p className="mt-2 text-center text-body-md text-ink-soft">
        커뮤니티에서 표시될 이름이에요. 나중에 프로필에서 바꿀 수 있어요.
      </p>
      <div className="surface mt-6 p-6">
        <NicknameForm suggestion={suggestion} next={next} />
      </div>
    </div>
  );
}
