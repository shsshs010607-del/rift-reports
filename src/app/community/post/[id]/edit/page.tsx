import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getPost } from "@/lib/community";
import { PostForm } from "@/components/community/post-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "글 수정" };

export default async function EditPostPage({ params }: { params: { id: string } }) {
  if (!hasSupabaseEnv) redirect(`/login?next=/community/post/${params.id}/edit`);

  const supabase = createClient();
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user ?? null;
  if (!user) redirect(`/login?next=/community/post/${params.id}/edit`);

  const post = await getPost(params.id);
  if (!post) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isStaff = profile?.role === "editor" || profile?.role === "admin";

  if (post.author_id !== user.id && !isStaff) {
    redirect(`/community/post/${params.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/community/post/${post.id}`}
        className="mb-3 inline-flex items-center gap-1 text-body-sm text-ink-soft hover:text-primary-strong"
      >
        <ChevronLeft className="h-4 w-4" />
        글로 돌아가기
      </Link>
      <h1 className="mb-1 font-display text-headline-sm text-ink">글 수정</h1>
      <p className="mb-5 text-body-sm text-ink-soft">
        수정한 내용은 바로 반영됩니다.
      </p>
      <div className="note-card p-5 sm:p-6">
        <PostForm
          canWriteNotice={isStaff}
          edit={{
            postId: post.id,
            title: post.title,
            body: post.body,
            category: post.category,
          }}
        />
      </div>
    </div>
  );
}
