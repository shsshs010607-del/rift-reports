"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

/** 공지 노출 순서(높을수록 위) — 스태프 전용. 기본값 0 이면 등록순(최신순)으로 표시. */
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

/**
 * 게시판 개편(2026-09-23)으로 새 글쓰기·수정은 없앴다 — 남은 건 기존 글/댓글 정리(삭제)와
 * 추천 토글뿐. 새 글쓰기는 네이버 카페 자유게시판으로 안내한다.
 */
export async function deletePost(postId: string) {
  const { supabase } = await requireUser();
  const { data: post } = await supabase.from("posts").select("category").eq("id", postId).maybeSingle();
  const { error } = await supabase.from("posts").delete().eq("id", postId); // RLS 가 본인/스태프 검증
  if (error) return { error: error.message };
  revalidatePath("/community");
  if (post) revalidatePath(`/community/${post.category}`);
  redirect(post ? `/community/${post.category}` : "/community");
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
