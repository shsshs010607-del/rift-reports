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
});

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
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  return { supabase, userId: data.user.id };
}

async function isStaff(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  return data?.role === "editor" || data?.role === "admin";
}

export async function createPost(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, userId } = await requireUser();

  const parsed = postSchema.safeParse({
    category: formData.get("category"),
    title: formData.get("title"),
    body: formData.get("body"),
    is_notice: formData.get("is_notice") === "on",
  });
  if (!parsed.success) {
    const f: Record<string, string> = {};
    for (const issue of parsed.error.issues) f[String(issue.path[0])] = issue.message;
    return { error: "입력을 확인하세요", fieldErrors: f };
  }

  // 공지는 스태프만
  if (parsed.data.is_notice && !(await isStaff(supabase, userId))) {
    return { error: "공지는 관리자만 작성할 수 있습니다" };
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
    })
    .select("id, category")
    .single();

  if (error || !data) return { error: error?.message ?? "작성에 실패했습니다" };

  revalidatePath("/community");
  revalidatePath(`/community/${data.category}`);
  redirect(`/community/post/${data.id}`);
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

  revalidatePath(`/community/post/${parsed.data.post_id}`);
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
  const supabase = createClient();
  await supabase.rpc("increment_view_count", { table_name: table, row_id: postId });
}
