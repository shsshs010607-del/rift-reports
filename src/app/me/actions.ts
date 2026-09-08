"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NICKNAME_RE } from "@/lib/auth/nickname";

export type ProfileState = { error?: string; ok?: boolean };

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/me");

  const username = String(formData.get("username") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();

  if (!NICKNAME_RE.test(username)) {
    return { error: "닉네임은 2~20자, 한글·영문·숫자·_- 만 가능해요." };
  }
  if (bio.length > 300) {
    return { error: "소개는 300자 이하로 적어주세요." };
  }

  // 닉네임이 바뀌었을 때만 중복 확인
  const { data: current } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (current && current.username.toLowerCase() !== username.toLowerCase()) {
    const { data: available } = await supabase.rpc("username_available", { name: username });
    if (!available) return { error: "이미 사용 중인 닉네임이에요." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ username, bio: bio || null, onboarded: true })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") return { error: "이미 사용 중인 닉네임이에요." };
    return { error: error.message };
  }

  revalidatePath("/me");
  return { ok: true };
}

/** 아바타 URL 저장 (null = 제거). 업로드 자체는 클라이언트가 Storage 로. */
export async function setAvatar(url: string | null): Promise<ProfileState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/me");

  if (url && !/^https:\/\/[\w.-]+\.supabase\.co\/storage\/v1\/object\/public\/avatars\//.test(url)) {
    return { error: "잘못된 이미지 주소예요." };
  }

  const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/me");
  revalidatePath("/", "layout");
  return { ok: true };
}
