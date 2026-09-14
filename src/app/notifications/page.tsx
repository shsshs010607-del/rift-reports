import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { PageHeading } from "@/components/ui/page-heading";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { getNotificationFeed } from "@/lib/notifications";

export const metadata: Metadata = { title: "알림" };
// getNotificationFeed() 가 cookies() 를 try/catch 로 감싸고 있어서 force-dynamic
// 없이는 빌드 시 정적 생성 시도가 타임아웃난다 — 지우지 말 것.
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const feed = await getNotificationFeed(100);

  let seenAt: string | null = null;
  if (hasSupabaseEnv && feed.signedIn) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("notifications_seen_at")
        .eq("id", user.id)
        .maybeSingle();
      seenAt = data?.notifications_seen_at ?? null;
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeading title="알림" description="운영진이 보낸 공지·업데이트·이벤트 소식" />
      <NotificationCenter
        initialItems={feed.items}
        seenAt={seenAt}
        signedIn={feed.signedIn}
      />
    </div>
  );
}
