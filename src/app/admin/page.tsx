import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { PageHeading } from "@/components/ui/page-heading";
import {
  ReportForm,
  TournamentForm,
  ShopForm,
  NotificationForm,
  NotificationList,
} from "@/components/admin/admin-forms";

export const metadata: Metadata = { title: "운영" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!hasSupabaseEnv) redirect("/login?next=/admin");
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, username")
    .eq("id", user.id)
    .maybeSingle();

  const isStaff = profile?.role === "editor" || profile?.role === "admin";
  const { data: notifications } = isStaff
    ? await supabase
        .from("notifications")
        .select("id, title, kind, created_at")
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: [] };

  if (profile?.role !== "editor" && profile?.role !== "admin") {
    return (
      <div className="mx-auto max-w-lg py-10 text-center">
        <PageHeading title="운영 페이지" />
        <p className="text-body-md text-ink-soft">
          이 페이지는 운영진(editor·admin)만 접근할 수 있습니다.
          <br />
          현재 역할: <strong>{profile?.role ?? "user"}</strong>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeading
        title="운영"
        description={`${profile.username} · ${profile.role} — 알림 · 리포트 · 대회 · 카드샵`}
      />

      <div className="flex flex-col gap-10">
        <section>
          <h2 className="section-title mb-3">알림 발송</h2>
          <div className="surface note-card p-5">
            <NotificationForm />
          </div>
          <div className="mt-3">
            <h3 className="mb-2 text-label-lg font-bold text-ink-soft">발송한 알림</h3>
            <NotificationList items={notifications ?? []} />
          </div>
        </section>

        <section>
          <h2 className="section-title mb-3">리포트 작성</h2>
          <div className="surface note-card p-5">
            <ReportForm />
          </div>
        </section>

        <section>
          <h2 className="section-title mb-3">대회 등록</h2>
          <div className="surface note-card p-5">
            <TournamentForm />
          </div>
        </section>

        <section>
          <h2 className="section-title mb-3">카드샵 등록</h2>
          <div className="surface note-card p-5">
            <ShopForm />
          </div>
        </section>
      </div>
    </div>
  );
}
