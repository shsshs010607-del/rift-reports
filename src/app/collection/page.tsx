import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { PageHeading } from "@/components/ui/page-heading";
import { CollectionEditor } from "@/components/me/collection-editor";
import { getMyCollection } from "@/lib/collection";
import { getPriceIndex } from "@/lib/prices";
import { getUsdKrw } from "@/lib/fx";

export const metadata: Metadata = { title: "내 컬렉션" };
// getMyCollection() 이 cookies() 를 try/catch 로 감싸고 있어서 force-dynamic 없이는
// 빌드 시 정적 생성 시도가 타임아웃난다 — 지우지 말 것.
export const dynamic = "force-dynamic";

export default async function CollectionPage() {
  if (!hasSupabaseEnv) redirect("/login?next=/collection");
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/collection");

  const [collection, priceIndex, fx] = await Promise.all([
    getMyCollection(),
    getPriceIndex(),
    getUsdKrw(),
  ]);
  const priceByNumber: Record<string, number> = {};
  for (const [num, p] of priceIndex) priceByNumber[num] = Math.round(p.usd * fx.usdKrw);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeading title="내 컬렉션" description="보유한 카드를 정리하고 추정 시세를 확인하세요" />
      <CollectionEditor initial={collection} priceByNumber={priceByNumber} />
    </div>
  );
}
