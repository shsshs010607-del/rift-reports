import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { PageHeading, ComingSoon } from "@/components/ui/page-heading";

export default async function NewTradePage() {
  if (!hasSupabaseEnv) redirect("/login?next=/trading/new");
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/trading/new");

  return (
    <div>
      <PageHeading title="거래글 등록" />
      <ComingSoon note="카테고리, 카드 검색 연결(card_id), 상태(TRADE_CONDITIONS), 가격/협의 여부, 지역, 이미지 업로드(Storage: trade-images/{uid}/). 제출 → trade_listings insert." />
    </div>
  );
}
