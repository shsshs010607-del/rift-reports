import "server-only";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { Notification } from "@/lib/types/database";

export type NotificationFeed = {
  items: Notification[];
  unread: number;
  signedIn: boolean;
};

const EMPTY: NotificationFeed = { items: [], unread: 0, signedIn: false };

/**
 * 최근 알림 + 현재 사용자의 안 읽음 개수.
 * 사용자가 개인적으로 숨긴(dismiss) 알림은 제외한다.
 */
export async function getNotificationFeed(limit = 30): Promise<NotificationFeed> {
  if (!hasSupabaseEnv) return EMPTY;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: rows } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    let list = (rows as Notification[]) ?? [];

    if (!user) return { items: list.slice(0, 15), unread: 0, signedIn: false };

    const [{ data: profile }, { data: dismissed }] = await Promise.all([
      supabase.from("profiles").select("notifications_seen_at").eq("id", user.id).maybeSingle(),
      supabase.from("notification_dismissals").select("notification_id").eq("user_id", user.id),
    ]);

    const hidden = new Set((dismissed ?? []).map((d) => d.notification_id));
    list = list.filter((n) => !hidden.has(n.id));

    const seen = profile?.notifications_seen_at
      ? new Date(profile.notifications_seen_at).getTime()
      : 0;
    const unread = list.filter((n) => new Date(n.created_at).getTime() > seen).length;
    return { items: list, unread, signedIn: true };
  } catch {
    return EMPTY;
  }
}
