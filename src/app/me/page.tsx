import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { PageHeading, ComingSoon } from "@/components/ui/page-heading";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function MePage() {
  if (!hasSupabaseEnv) redirect("/login");
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/me");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeading title={profile?.username ?? "내 프로필"} description={data.user.email ?? undefined} />

      {profile && !profile.onboarded && (
        <a
          href="/onboarding?next=/me"
          className="mb-4 block rounded-xl border border-primary/30 bg-primary-wash/60 p-3 text-body-sm font-semibold text-primary-strong"
        >
          아직 닉네임을 설정하지 않았어요. 지금 설정하기 →
        </a>
      )}

      <div className="surface flex items-center justify-between p-4">
        <span className="text-body-md text-ink-soft">역할: {profile?.role ?? "user"}</span>
        <SignOutButton />
      </div>
      <div className="mt-6">
        <ComingSoon note="내가 쓴 글/댓글/거래글, 북마크, 프로필 편집(username·avatar·bio)." />
      </div>
    </div>
  );
}
