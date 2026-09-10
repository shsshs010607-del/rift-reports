import { HomeCardSearch } from "@/components/home/home-card-search";
import { ChannelBanner } from "@/components/home/channel-banner";

/** 캐러셀 아래 별도 줄 — 카드 검색 + SNS·커뮤니티 바로가기. */
export function HomeQuickBar() {
  return (
    <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <HomeCardSearch />
        <ChannelBanner className="lg:justify-end" />
      </div>
    </section>
  );
}
