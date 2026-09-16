import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { PageHeading } from "@/components/ui/page-heading";
import { CafePostsHelper } from "@/components/admin/cafe-posts-helper";

export const metadata: Metadata = { title: "매장 소식 초안" };
// createClient() 가 쿠키를 읽어 이미 동적 렌더로 처리된다 (force-dynamic 불필요).

export default async function CafePostsAdminPage() {
  if (!hasSupabaseEnv) redirect("/login?next=/admin/cafe-posts");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/cafe-posts");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, username")
    .eq("id", user.id)
    .maybeSingle();

  const isStaff = profile?.role === "editor" || profile?.role === "admin";
  if (!isStaff) {
    return (
      <div className="mx-auto max-w-lg py-10 text-center">
        <PageHeading title="매장 소식 초안" />
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
        title="매장 소식 초안"
        description="디시인사이드 리프트바운드 갤러리 매장 이벤트 공지를 네이버 카페 「매장 소식」에 붙여넣기 좋게 정리했습니다. 카드마다 복사하기 → 카페 글쓰기에 붙여넣고, 사진은 눌러서 원본으로 연 뒤 카페에 업로드하면 됩니다."
      />
      <CafePostsHelper />
    </div>
  );
}
