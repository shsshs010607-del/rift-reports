import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Gift, ArrowRight } from "lucide-react";
import { fmtKstShort } from "@/lib/datetime";
import { createClient } from "@/lib/supabase/server";
import { getPost, getComments, getLikedPostIds } from "@/lib/community";
import { thumbOf, excerptOf } from "@/lib/community-preview";
import { COMMUNITY_CATEGORIES, SITE, CAFE_EVENT } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { LikeButton } from "@/components/community/like-button";
import { ViewCounter } from "@/components/community/view-counter";
import { CommentSection } from "@/components/community/comment-section";
import { PostActions } from "@/components/community/post-actions";
import { PostBody } from "@/components/community/post-body";
import { Avatar } from "@/components/community/avatar";
import { CategoryBadge, metaFor } from "@/components/community/category-meta";
import { CommunityCafeCrossPost } from "@/components/community/community-cafe-cross-post";

// getPost/getComments/getLikedPostIds 가 cookies() 를 try/catch(safe()) 로
// 감싸고 있어서 force-dynamic 없이는 빌드 시 정적 생성 시도가 타임아웃난다 — 지우지 말 것.
export const dynamic = "force-dynamic";

// 이 라우트는 원래 canonical/title 을 따로 안 정해서 루트 레이아웃 값(홈 "/")을
// 그대로 상속했다 — 게시글마다 다 "canonical=홈"으로 선언되는 꼴이라 Search
// Console 이 "표준 없는 중복 페이지"로 잡아냈다. 글별 제목·canonical 로 고정.
export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const post = await getPost(params.id);
  if (!post) return {};
  const description = excerptOf(post.body);
  const image = thumbOf(post.body) ?? "/brand/logo.png";
  return {
    title: post.title,
    description,
    alternates: { canonical: `/community/post/${params.id}` },
    // 네이버 블로그/카페 등에 링크 공유될 때 미리보기(썸네일)가 뜨도록.
    openGraph: { title: post.title, description, images: [image], type: "article" },
    twitter: { card: "summary_large_image", title: post.title, description, images: [image] },
  };
}

export default async function PostDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const [post, comments] = await Promise.all([getPost(params.id), getComments(params.id)]);
  if (!post) notFound();

  const supabase = await createClient();
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
  const m = metaFor(post.category);

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
          "overflow-hidden rounded-2xl border border-line/70 bg-gradient-to-b to-card to-[42%] p-5 sm:p-6",
          post.is_notice ? "from-primary/[0.08]" : m.bandFrom,
        )}
      >
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
            "mt-2.5 font-display text-headline-md leading-snug",
            post.is_notice ? "text-primary-strong" : "text-ink",
          )}
        >
          {post.title}
        </h1>
        {post.tags?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {post.tags.map((t) => (
              <Link
                key={t}
                href={`/community?tag=${encodeURIComponent(t)}`}
                className="rounded-full bg-subcanvas px-2 py-0.5 text-label-sm font-bold text-ink-soft transition hover:text-primary-strong"
              >
                #{t}
              </Link>
            ))}
          </div>
        )}
        <div className="mt-3.5 flex items-center gap-2.5 text-body-sm text-ink-soft">
          <Avatar name={post.author?.username} src={post.author?.avatar_url} size="md" />
          <div className="leading-tight">
            <span className="block font-bold text-ink">
              {post.author?.username ?? "알 수 없음"}
            </span>
            <span className="block text-[12px]">
              <time dateTime={post.created_at}>{fmtKstShort(post.created_at)}</time>
              {new Date(post.updated_at).getTime() - new Date(post.created_at).getTime() > 60_000 && (
                <span className="text-ink-soft/70"> (수정됨)</span>
              )}
              {" · 조회 "}
              {post.view_count}
            </span>
          </div>
          {(isOwner || canModerate) && (
            <span className="ml-auto">
              <PostActions
                postId={post.id}
                noticeOrder={canModerate && post.is_notice}
                noticePriority={post.notice_priority}
              />
            </span>
          )}
        </div>
      </header>

      <div className="mt-6 px-1 sm:px-2">
        <PostBody text={post.body} />
      </div>

      {post.id === CAFE_EVENT.postId ? (
        <div className="mt-6 px-1 sm:px-2">
          <div className="rounded-2xl border border-[#03C75A]/30 bg-[#03C75A]/[0.07] p-4">
            <p className="text-body-md font-bold text-ink">가입인증글 바로쓰기</p>
            <p className="mt-0.5 text-body-sm text-ink-soft">
              카페 가입 후, 자유게시판에 인증 글을 쓰면 응모 완료예요. 아래 버튼을 누르면 카테고리·태그가
              자동으로 채워져요.
            </p>
            <Link
              href={`/community/new?category=riftbound&tag=${encodeURIComponent(CAFE_EVENT.tag)}`}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#03C75A] px-4 py-2 text-label-md font-bold text-white transition hover:brightness-95"
            >
              <Gift className="h-4 w-4" />
              가입인증글 바로쓰기
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        isOwner && (
          <div className="mt-6 px-1 sm:px-2">
            <CommunityCafeCrossPost
              title={post.title}
              categoryLabel={cat?.label ?? post.category}
              body={post.body}
              permalink={`${SITE.url}/community/post/${post.id}`}
              tags={post.tags}
              category={post.category}
            />
          </div>
        )
      )}

      <div className="mt-10 flex justify-center">
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
