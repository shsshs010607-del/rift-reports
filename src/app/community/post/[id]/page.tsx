import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Megaphone, ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPost, getComments, getLikedPostIds } from "@/lib/community";
import { COMMUNITY_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { LikeButton } from "@/components/community/like-button";
import { ViewCounter } from "@/components/community/view-counter";
import { CommentSection } from "@/components/community/comment-section";
import { PostActions } from "@/components/community/post-actions";

export const dynamic = "force-dynamic";

export default async function PostDetailPage({ params }: { params: { id: string } }) {
  const [post, comments] = await Promise.all([getPost(params.id), getComments(params.id)]);
  if (!post) notFound();

  const supabase = createClient();
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user ?? null;

  let canModerate = false;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    canModerate = profile?.role === "editor" || profile?.role === "admin";
  }

  const likedSet = await getLikedPostIds([post.id]);
  const cat = COMMUNITY_CATEGORIES.find((c) => c.slug === post.category);
  const isOwner = user?.id === post.author_id;

  return (
    <article className="mx-auto max-w-3xl">
      <ViewCounter postId={post.id} />

      <Link
        href={`/community/${post.category}`}
        className="mb-4 inline-flex items-center gap-1 text-body-sm text-ink-soft hover:text-primary-strong"
      >
        <ChevronLeft className="h-4 w-4" />
        {cat?.label ?? "커뮤니티"}
      </Link>

      <header
        className={cn(
          "rounded-2xl border p-5",
          post.is_notice ? "border-amber/30 bg-amber/[0.06]" : "border-line/80 bg-card",
        )}
      >
        <div className="flex items-center gap-2">
          {post.is_notice && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber/15 px-2 py-0.5 text-label-sm font-bold uppercase text-[#B45309]">
              <Megaphone className="h-3 w-3" />
              공지
            </span>
          )}
          <span className="chip">{cat?.label ?? post.category}</span>
        </div>
        <h1 className={cn("mt-2 font-display text-headline-md", post.is_notice ? "text-[#B45309]" : "text-ink")}>
          {post.title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-ink-soft">
          <span className="font-semibold text-ink">{post.author?.username ?? "알 수 없음"}</span>
          <time dateTime={post.created_at}>
            {format(new Date(post.created_at), "yyyy.MM.dd HH:mm", { locale: ko })}
          </time>
          <span>조회 {post.view_count}</span>
          <span>추천 {post.like_count}</span>
          <span>댓글 {post.comment_count}</span>
          {(isOwner || canModerate) && (
            <span className="ml-auto">
              <PostActions postId={post.id} />
            </span>
          )}
        </div>
      </header>

      <div className="mt-6 whitespace-pre-wrap text-body-lg leading-relaxed text-ink">{post.body}</div>

      <div className="mt-8 flex justify-center">
        <LikeButton
          postId={post.id}
          initialCount={post.like_count}
          initialLiked={likedSet.has(post.id)}
          canLike={Boolean(user)}
        />
      </div>

      <CommentSection
        postId={post.id}
        comments={comments}
        currentUserId={user?.id ?? null}
        canModerate={canModerate}
      />
    </article>
  );
}
