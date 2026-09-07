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

/** 최근 알림 + 현재 사용자의 안 읽음 개수. */
export async function getNotificationFeed(limit = 15): Promise<NotificationFeed> {
  if (!hasSupabaseEnv) return EMPTY;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: items } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    const list = (items as Notification[]) ?? [];
    if (!user) return { items: list, unread: 0, signedIn: false };

    const { data: profile } = await supabase
      .from("profiles")
      .select("notifications_seen_at")
      .eq("id", user.id)
      .maybeSingle();

    const seen = profile?.notifications_seen_at
      ? new Date(profile.notifications_seen_at).getTime()
      : 0;
    const unread = list.filter((n) => new Date(n.created_at).getTime() > seen).length;
    return { items: list, unread, signedIn: true };
  } catch {
    return EMPTY;
  }
}
