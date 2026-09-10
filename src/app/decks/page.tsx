import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { PageHeading } from "@/components/ui/page-heading";
import { MetaDeckBrowser } from "@/components/decks/meta-deck-browser";
import { getMetaDecks } from "@/lib/meta-decks";
import { getCardService } from "@/lib/services/cardService";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "메타 덱",
  description: "한국 스탠다드(OGN·OGS) 카드풀 대회 덱리스트 모음. 덱 시뮬레이터로 바로 열어볼 수 있습니다.",
};
// 로그인/역할에 따라 삭제 버튼을 노출하므로 동적 렌더.
export const dynamic = "force-dynamic";

/** 현재 사용자가 운영진(editor·admin)인지. */
async function viewerIsStaff(): Promise<boolean> {
  if (!hasSupabaseEnv) return false;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    return data?.role === "editor" || data?.role === "admin";
  } catch {
    return false;
  }
}

/** 레전드 ref(A299 = OGN-299) → 아트 URL */
async function legendImagesByRef(): Promise<Record<string, string>> {
  try {
    const legends = await getCardService().searchCards({ type: "legend" });
    const out: Record<string, string> = {};
    for (const c of legends) {
      const letter = c.setCode === "OGN" ? "A" : c.setCode === "OGS" ? "B" : null;
      const num = (c.collectorNumber ?? "").replace(/\D+/g, "");
      const img = c.imageUrl ?? c.localization.en.imageUrl;
      if (letter && num && img) out[`${letter}${num}`] = img;
    }
    return out;
  } catch {
    return {};
  }
}

export default async function DecksPage({
  searchParams,
}: {
  searchParams: { legend?: string };
}) {
  const [decks, images, isStaff] = await Promise.all([
    getMetaDecks(),
    legendImagesByRef(),
    viewerIsStaff(),
  ]);

  return (
    <div>
      <PageHeading
        title="메타 덱"
        description="한국 스탠다드(OGN·OGS) 카드풀에 맞는 대회 덱리스트. 카드를 눌러 덱 시뮬레이터로 바로 열 수 있습니다."
      />

      {decks.length === 0 ? (
        <div className="note-card mt-4 grid place-items-center px-6 py-16 text-center">
          <p className="text-body-md text-ink-soft">
            아직 등록된 메타 덱이 없습니다. 곧 채워집니다.
          </p>
        </div>
      ) : (
        <MetaDeckBrowser
          decks={decks}
          images={images}
          initialLegend={searchParams.legend}
          isStaff={isStaff}
        />
      )}

      <p className="mt-8 flex items-center gap-1.5 text-body-sm text-ink-soft">
        덱 데이터 제공:
        <Link
          href="https://piltoverarchive.com/decks"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 font-semibold text-primary-strong hover:underline"
        >
          Piltover Archive <ExternalLink className="h-3 w-3" />
        </Link>
      </p>
    </div>
  );
}
