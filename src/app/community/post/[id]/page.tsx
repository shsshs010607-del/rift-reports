import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { fmtKstShort } from "@/lib/datetime";
import { createClient } from "@/lib/supabase/server";
import { getPost, getComments, getLikedPostIds } from "@/lib/community";
import { COMMUNITY_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { LikeButton } from "@/components/community/like-button";
import { ViewCounter } from "@/components/community/view-counter";
import { CommentSection } from "@/components/community/comment-section";
import { PostActions } from "@/components/community/post-actions";
import { PostBody } from "@/components/community/post-body";
import { Avatar } from "@/components/community/avatar";
import { CategoryBadge } from "@/components/community/category-meta";

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

      <header className="border-b border-line/60 pb-4">
        <div className="flex items-center gap-1.5">
          {post.is_notice && (
            <span className="rounded bg-primary px-1.5 py-0.5 text-[11px] font-bold text-white">
              공지
            </span>
          )}
          <CategoryBadge slug={post.category} />
        </div>
        <h1
          className={cn(
            "mt-2 font-display text-headline-sm leading-snug",
            post.is_notice ? "text-primary-strong" : "text-ink",
          )}
        >
          {post.title}
        </h1>
        <div className="mt-2.5 flex items-center gap-2 text-body-sm text-ink-soft">
          <Avatar name={post.author?.username} src={post.author?.avatar_url} size="sm" />
          <span className="font-bold text-ink">{post.author?.username ?? "알 수 없음"}</span>
          <span aria-hidden>·</span>
          <time dateTime={post.created_at}>{fmtKstShort(post.created_at)}</time>
          <span aria-hidden>·</span>
          <span>조회 {post.view_count}</span>
          {(isOwner || canModerate) && (
            <span className="ml-auto">
              <PostActions postId={post.id} />
            </span>
          )}
        </div>
      </header>

      <div className="mt-5">
        <PostBody text={post.body} />
      </div>

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
