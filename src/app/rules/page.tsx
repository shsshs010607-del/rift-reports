import type { Metadata } from "next";
import { ArrowUpRight, ExternalLink, Gamepad2 } from "lucide-react";
import { BeginnerGuide } from "@/components/rules/beginner-guide";
import { DiscordCta } from "@/components/community/discord-cta";
import { getCardService, CardServiceError } from "@/lib/services/cardService";
import type { Card } from "@/lib/types/card";

const RIFT_ATLAS_URL = "https://play.riftatlas.com/";
const CORE_RULES_PDF =
  "https://cmsassets.rgpub.io/sanity/files/dsfx7636/news_live/572377fcaa704a05f72eb42c104079d3b3bcf740.pdf";

export const metadata: Metadata = {
  title: "초보자 가이드",
  description: "리프트바운드 초보자 가이드 — 게임 목표, 준비, 게임판 구역, 턴 진행, 자원, 전투, 점수.",
};

export const revalidate = 3600;

async function pickExampleCard(): Promise<Card | null> {
  try {
    const all = await getCardService().getAllCards();
    return (
      all.find(
        (c) => c.type === "unit" && typeof c.cost === "number" && c.cost >= 2 && c.cost <= 4 && c.domains.length === 1,
      ) ??
      all.find((c) => c.type === "unit" && typeof c.cost === "number") ??
      null
    );
  } catch (err) {
    if (!(err instanceof CardServiceError)) throw err;
    return null;
  }
}

export default async function RulesPage() {
  const exampleCard = await pickExampleCard();

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-headline-md text-ink">초보자 가이드</h1>
        <p className="mt-0.5 text-body-md text-ink-soft">
          Riftbound Core Rules(2025-12-01) 요약. 정확한 판정은 최신 공식 룰을 따르세요.
        </p>
        <a
          href={CORE_RULES_PDF}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-label-md font-bold text-primary-strong hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          공식 Core Rules 원문 보기 (PDF · 영문)
        </a>
      </header>

      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        <div className="surface flex flex-col justify-between gap-3 p-5">
          <div>
            <p className="inline-flex items-center gap-1.5 text-label-sm font-bold uppercase tracking-wide text-primary-strong">
              <Gamepad2 className="h-4 w-4" />
              TCG가 처음이신가요?
            </p>
            <p className="mt-1.5 text-body-sm leading-relaxed text-ink-soft">
              카드가 없어도 괜찮아요 — Rift Atlas에서 브라우저로 바로 룰을 연습하고 게임을
              시뮬레이션해볼 수 있어요.
            </p>
          </div>
          <a
            href={RIFT_ATLAS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-label-md font-bold text-white transition hover:bg-primary-container"
          >
            Rift Atlas에서 연습하기
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <DiscordCta />
      </div>

      <BeginnerGuide exampleCard={exampleCard} />
    </div>
  );
}
