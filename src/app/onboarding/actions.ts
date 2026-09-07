"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NICKNAME_RE } from "@/lib/auth/nickname";

export type NickState = { error?: string };

const safeNext = (raw: string) =>
  raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";

export async function setNickname(_prev: NickState, formData: FormData): Promise<NickState> {
  const name = String(formData.get("nickname") ?? "").trim();
  const next = safeNext(String(formData.get("next") ?? "/"));

  if (!NICKNAME_RE.test(name)) {
    return { error: "2~20자, 한글·영문·숫자·_- 만 사용할 수 있어요." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: available, error: rpcErr } = await supabase.rpc("username_available", { name });
  if (rpcErr) return { error: rpcErr.message };
  if (!available) return { error: "이미 사용 중인 닉네임이에요." };

  const { error } = await supabase
    .from("profiles")
    .update({ username: name, onboarded: true })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") return { error: "이미 사용 중인 닉네임이에요." };
    return { error: error.message };
  }

  redirect(next);
}
