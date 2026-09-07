import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { PageHeading } from "@/components/ui/page-heading";
import { ListingForm } from "@/components/trading/listing-form";

export const metadata: Metadata = { title: "거래글 등록" };

export default async function NewTradePage() {
  if (!hasSupabaseEnv) redirect("/login?next=/trading/new");
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/trading/new");

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeading title="거래글 등록" description="카드 시세는 상단 '카드 시세'에서 확인하세요" />
      <div className="surface p-5 sm:p-6">
        <ListingForm />
      </div>
    </div>
  );
}
