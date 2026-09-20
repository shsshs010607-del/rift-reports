import "server-only";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { rethrowIfNextControlFlow } from "@/lib/next-dynamic-error";
import type { Notification } from "@/lib/types/database";

export type NotificationFeed = {
  items: Notification[];
  unread: number;
  signedIn: boolean;
};

/** 알림 링크는 사이트 내부 경로만 — 다른 유저가 심은 외부/피싱 URL 이 알림벨에 노출되지 않게 한다. */
const internalHref = (href: string | null) =>
  href && href.startsWith("/") && !href.startsWith("//") && !href.includes("\\") ? href : null;

const EMPTY: NotificationFeed = { items: [], unread: 0, signedIn: false };

/**
 * 최근 알림 + 현재 사용자의 안 읽음 개수.
 * 사용자가 개인적으로 숨긴(dismiss) 알림은 제외한다.
 */
export async function getNotificationFeed(limit = 30): Promise<NotificationFeed> {
  if (!hasSupabaseEnv) return EMPTY;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: rows } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    let list = ((rows as Notification[]) ?? []).map((n) => ({ ...n, href: internalHref(n.href) }));

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
  } catch (e) {
    rethrowIfNextControlFlow(e);
    return EMPTY;
  }
}
