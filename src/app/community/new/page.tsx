import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { PageHeading } from "@/components/ui/page-heading";
import { PostForm } from "@/components/community/post-form";
import { COMMUNITY_CATEGORIES } from "@/lib/constants";

export const metadata: Metadata = { title: "글쓰기" };

export default async function NewPostPage({ searchParams }: { searchParams: { category?: string } }) {
  if (!hasSupabaseEnv) redirect("/login?next=/community/new");

  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/community/new");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();
  const canWriteNotice = profile?.role === "editor" || profile?.role === "admin";

  const defaultCategory = COMMUNITY_CATEGORIES.find((c) => c.slug === searchParams.category)?.slug;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeading title="글쓰기" />
      <PostForm defaultCategory={defaultCategory} canWriteNotice={canWriteNotice} />
    </div>
  );
}
