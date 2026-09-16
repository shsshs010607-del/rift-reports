"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { COMMUNITY_CATEGORIES } from "@/lib/constants";
import type { CommunityCategory } from "@/lib/types/database";

const categorySlugs = COMMUNITY_CATEGORIES.map((c) => c.slug) as [string, ...string[]];

const postSchema = z.object({
  category: z.enum(categorySlugs),
  title: z.string().trim().min(2, "제목은 2자 이상").max(150, "제목은 150자 이하"),
  body: z.string().trim().min(1, "내용을 입력하세요").max(20000),
  is_notice: z.boolean().optional(),
  tags: z.array(z.string().trim().min(1).max(20)).max(5).optional(),
});

/** "이벤트응모, 가입인사" 같은 콤마 구분 입력 → 정리된 태그 배열 (최대 5개, 개당 20자). */
function parseTags(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string") return [];
  const seen = new Set<string>();
  for (const part of raw.split(/[,\s#]+/)) {
    const tag = part.trim();
    if (!tag) continue;
    seen.add(tag.slice(0, 20));
    if (seen.size >= 5) break;
  }
  return [...seen];
}

/** 유효해 보이는 덱 코드면 반환, 아니면 null. */
function normalizeDeckCode(raw: FormDataEntryValue | null): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;
  if (s.startsWith("rr1.")) return s.slice(0, 4000);
  if (/^[A-Za-z0-9_-]{16,4000}$/.test(s)) return s; // base64url 공유 코드
  return null;
}

export type ActionState = { error?: string; fieldErrors?: Record<string, string> };

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  return { supabase, userId: data.user.id };
}

async function isStaff(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  return data?.role === "editor" || data?.role === "admin";
}

/** 매장 정보 게시판 글쓰기 — 스태프(editor/admin) 또는 role="store"(매장 운영자에게 부여). */
async function canWriteTournament(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  return data?.role === "editor" || data?.role === "admin" || data?.role === "store";
}

export async function createPost(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, userId } = await requireUser();

  const parsed = postSchema.safeParse({
    category: formData.get("category"),
    title: formData.get("title"),
    body: formData.get("body"),
    is_notice: formData.get("is_notice") === "on",
    tags: parseTags(formData.get("tags")),
  });
  if (!parsed.success) {
    const f: Record<string, string> = {};
    for (const issue of parsed.error.issues) f[String(issue.path[0])] = issue.message;
    return { error: "입력을 확인하세요", fieldErrors: f };
  }

  // 공지 / 리프트 리포트는 스태프만
  if (parsed.data.is_notice && !(await isStaff(supabase, userId))) {
    return { error: "공지는 관리자만 작성할 수 있습니다" };
  }
  if (parsed.data.category === "report" && !(await isStaff(supabase, userId))) {
    return { error: "리프트 리포트는 관리자만 작성할 수 있습니다" };
  }
  if (parsed.data.category === "tournament" && !(await canWriteTournament(supabase, userId))) {
    return { error: "매장 정보 게시판은 스태프 또는 매장 계정만 작성할 수 있습니다" };
  }

  // 덱공략 + 덱 코드 → 본문 상단에 ```deck 블록 삽입 (이미 있으면 생략)
  let body = parsed.data.body;
  const deckCode = normalizeDeckCode(formData.get("deck_code"));
  if (parsed.data.category === "deck-guide" && deckCode && !/```deck/.test(body)) {
    body = `\`\`\`deck\n${deckCode}\n\`\`\`\n\n${body}`;
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      category: parsed.data.category as CommunityCategory,
      title: parsed.data.title,
      body,
      author_id: userId,
      is_notice: parsed.data.is_notice ?? false,
      tags: parsed.data.tags ?? [],
    })
    .select("id, category")
    .single();

  if (error || !data) return { error: error?.message ?? "작성에 실패했습니다" };

  revalidatePath("/community");
  revalidatePath(`/community/${data.category}`);
  redirect(`/community/post/${data.id}`);
}

export async function updatePost(
  postId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, userId } = await requireUser();

  const parsed = postSchema.omit({ is_notice: true }).safeParse({
    category: formData.get("category"),
    title: formData.get("title"),
    body: formData.get("body"),
    tags: parseTags(formData.get("tags")),
  });
  if (!parsed.success) {
    const f: Record<string, string> = {};
    for (const issue of parsed.error.issues) f[String(issue.path[0])] = issue.message;
    return { error: "입력을 확인하세요", fieldErrors: f };
  }

  if (parsed.data.category === "report" && !(await isStaff(supabase, userId))) {
    return { error: "리프트 리포트는 관리자만 작성할 수 있습니다" };
  }
  if (parsed.data.category === "tournament" && !(await canWriteTournament(supabase, userId))) {
    return { error: "매장 정보 게시판은 스태프 또는 매장 계정만 작성할 수 있습니다" };
  }

  let body = parsed.data.body;
  const deckCode = normalizeDeckCode(formData.get("deck_code"));
  if (parsed.data.category === "deck-guide" && deckCode && !/```deck/.test(body)) {
    body = `\`\`\`deck\n${deckCode}\n\`\`\`\n\n${body}`;
  }

  const { data, error } = await supabase
    .from("posts")
    .update({
      category: parsed.data.category as CommunityCategory,
      title: parsed.data.title,
      body,
      tags: parsed.data.tags ?? [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId) // RLS: 본인/스태프만
    .select("id, category")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "수정 권한이 없거나 글을 찾을 수 없습니다" };

  revalidatePath("/community");
  revalidatePath(`/community/${data.category}`);
  revalidatePath(`/community/post/${postId}`);
  redirect(`/community/post/${postId}`);
}

/** 공지 글끼리의 노출 순서(높을수록 위) — 스태프 전용. 기본값 0 이면 등록순(최신순)으로 표시. */
export async function setNoticePriority(postId: string, priority: number) {
  const { supabase, userId } = await requireUser();
  if (!(await isStaff(supabase, userId))) return { error: "권한이 없습니다" };

  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("category, is_notice")
    .eq("id", postId)
    .maybeSingle();
  if (fetchError || !post) return { error: "글을 찾을 수 없습니다" };
  if (!post.is_notice) return { error: "공지 글만 순서를 지정할 수 있습니다" };

  const { error } = await supabase
    .from("posts")
    .update({ notice_priority: Math.trunc(priority) })
    .eq("id", postId);
  if (error) return { error: error.message };

  revalidatePath("/community");
  revalidatePath(`/community/${post.category}`);
  revalidatePath(`/community/post/${postId}`);
  revalidatePath("/");
  return {};
}

export async function deletePost(postId: string) {
  const { supabase } = await requireUser();
  const { data: post } = await supabase.from("posts").select("category").eq("id", postId).maybeSingle();
  const { error } = await supabase.from("posts").delete().eq("id", postId); // RLS 가 본인/스태프 검증
  if (error) return { error: error.message };
  revalidatePath("/community");
  if (post) revalidatePath(`/community/${post.category}`);
  redirect(post ? `/community/${post.category}` : "/community");
}

const commentSchema = z.object({
  post_id: z.string().uuid(),
  parent_id: z.string().uuid().optional().nullable(),
  body: z.string().trim().min(1, "댓글을 입력하세요").max(2000),
});

/** 글쓴이(및 답글이면 원댓글 작성자)에게 개인 알림 발송 — 본인 글/댓글엔 안 보냄. 실패해도 댓글 등록엔 영향 없음. */
async function notifyComment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  opts: { postId: string; parentId: string | null; commenterId: string; body: string },
) {
  const recipients = new Map<string, string>(); // userId -> 알림 제목

  const { data: post } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", opts.postId)
    .maybeSingle();
  if (post && post.author_id !== opts.commenterId) {
    recipients.set(post.author_id, "내 글에 새 댓글이 달렸습니다");
  }

  if (opts.parentId) {
    const { data: parent } = await supabase
      .from("comments")
      .select("author_id")
      .eq("id", opts.parentId)
      .maybeSingle();
    if (parent && parent.author_id !== opts.commenterId && !recipients.has(parent.author_id)) {
      recipients.set(parent.author_id, "내 댓글에 답글이 달렸습니다");
    }
  }

  if (recipients.size === 0) return;

  const preview = opts.body.trim().replace(/\s+/g, " ").slice(0, 80);
  const href = `/community/post/${opts.postId}`;
  await supabase.from("notifications").insert(
    [...recipients].map(([userId, title]) => ({
      title,
      body: preview,
      href,
      kind: "comment" as const,
      user_id: userId,
      created_by: opts.commenterId,
    })),
  );
}

export async function createComment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, userId } = await requireUser();
  const parsed = commentSchema.safeParse({
    post_id: formData.get("post_id"),
    parent_id: formData.get("parent_id") || null,
    body: formData.get("body"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력 오류" };

  const { error } = await supabase.from("comments").insert({
    post_id: parsed.data.post_id,
    parent_id: parsed.data.parent_id ?? null,
    body: parsed.data.body,
    author_id: userId,
  });
  if (error) return { error: error.message };

  await notifyComment(supabase, {
    postId: parsed.data.post_id,
    parentId: parsed.data.parent_id ?? null,
    commenterId: userId,
    body: parsed.data.body,
  }).catch(() => {});

  revalidatePath(`/community/post/${parsed.data.post_id}`);
  return {};
}

export async function updateComment(
  commentId: string,
  postId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase } = await requireUser();
  const parsed = z
    .string()
    .trim()
    .min(1, "댓글을 입력하세요")
    .max(2000)
    .safeParse(formData.get("body"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력 오류" };

  const { data, error } = await supabase
    .from("comments")
    .update({ body: parsed.data })
    .eq("id", commentId) // RLS: 본인만
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "수정 권한이 없습니다" };

  revalidatePath(`/community/post/${postId}`);
  return {};
}

export async function deleteComment(commentId: string, postId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) return { error: error.message };
  revalidatePath(`/community/post/${postId}`);
  return {};
}

/** 추천 토글. 반환값으로 현재 상태를 알려준다. */
export async function toggleLike(postId: string): Promise<{ liked: boolean; error?: string }> {
  const { supabase, userId } = await requireUser();

  const { data: existing } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
    if (error) return { liked: true, error: error.message };
    revalidatePath(`/community/post/${postId}`);
    return { liked: false };
  }

  const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
  if (error) return { liked: false, error: error.message };
  revalidatePath(`/community/post/${postId}`);
  return { liked: true };
}

/** 조회수 증가 (원자적). 비로그인도 가능. */
export async function incrementView(postId: string, table: "posts" | "reports" = "posts") {
  const supabase = await createClient();
  await supabase.rpc("increment_view_count", { table_name: table, row_id: postId });
}
