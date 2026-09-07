import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
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
    <div className="mx-auto max-w-2xl">
      <Link
        href={defaultCategory ? `/community/${defaultCategory}` : "/community"}
        className="mb-3 inline-flex items-center gap-1 text-body-sm text-ink-soft hover:text-primary-strong"
      >
        <ChevronLeft className="h-4 w-4" />
        돌아가기
      </Link>
      <h1 className="mb-5 font-display text-headline-sm text-ink">글쓰기</h1>
      <div className="rounded-2xl border border-line/70 bg-card p-5 sm:p-6">
        <PostForm defaultCategory={defaultCategory} canWriteNotice={canWriteNotice} />
      </div>
    </div>
  );
}
