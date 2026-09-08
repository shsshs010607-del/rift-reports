"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/notifications");
  return { supabase, userId: data.user.id };
}

/** 알림 하나를 내 화면에서 숨긴다. */
export async function dismissNotification(id: string): Promise<{ error?: string }> {
  const { supabase, userId } = await requireUser();
  const { error } = await supabase
    .from("notification_dismissals")
    .upsert({ notification_id: id, user_id: userId });
  if (error) return { error: error.message };
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  return {};
}

/** 현재 보이는 알림을 전부 숨긴다. */
export async function clearAllNotifications(): Promise<{ error?: string }> {
  const { supabase, userId } = await requireUser();
  const { data: ids } = await supabase
    .from("notifications")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (ids ?? []).map((n) => ({ notification_id: n.id, user_id: userId }));
  if (rows.length === 0) return {};
  const { error } = await supabase.from("notification_dismissals").upsert(rows);
  if (error) return { error: error.message };
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  return {};
}

/** 모든 알림을 읽음 처리 (마지막 확인 시각 갱신). */
export async function markNotificationsSeen(): Promise<{ error?: string }> {
  const { supabase, userId } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({ notifications_seen_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) return { error: error.message };
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  return {};
}
