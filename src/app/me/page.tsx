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
