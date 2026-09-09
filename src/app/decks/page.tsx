import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { PageHeading } from "@/components/ui/page-heading";
import { MetaDeckBrowser } from "@/components/decks/meta-deck-browser";
import { getMetaDecks } from "@/lib/meta-decks";
import { getCardService } from "@/lib/services/cardService";

export const metadata: Metadata = {
  title: "메타 덱",
  description: "한국 스탠다드(OGN·OGS) 카드풀 대회 덱리스트 모음. 덱 시뮬레이터로 바로 열어볼 수 있습니다.",
};
export const revalidate = 3600;

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

export default async function DecksPage() {
  const [decks, images] = await Promise.all([getMetaDecks(), legendImagesByRef()]);

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
        <MetaDeckBrowser decks={decks} images={images} />
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
