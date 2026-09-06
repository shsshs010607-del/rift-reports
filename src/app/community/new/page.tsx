import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { PageHeading, ComingSoon } from "@/components/ui/page-heading";

export default async function NewPostPage() {
  // 보안: 비로그인 접근 차단 (RLS와 별개로 UX 레벨 가드)
  if (!hasSupabaseEnv) redirect("/login?next=/community/new");
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/community/new");

  return (
    <div>
      <PageHeading title="글쓰기" />
      <ComingSoon note="카테고리 선택, 제목, 본문 에디터, (덱 분석 시) deck_id 연결. 제출은 Server Action → posts insert (author_id = auth.uid())." />
    </div>
  );
}
