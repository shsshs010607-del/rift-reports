import type { Metadata } from "next";
import Link from "next/link";
import { ShopExplorer } from "@/components/shops/shop-explorer";
import { getShops } from "@/lib/shops";

export const metadata: Metadata = { title: "주변 매장" };
export const revalidate = 300;

export default async function ShopsPage() {
  const shops = await getShops();

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-headline-md text-ink">주변 매장</h1>
        <p className="mt-0.5 text-body-md text-ink-soft">
          지역별 리프트바운드 카드샵 · 공인샵. 대회 일정은{" "}
          <Link href="/tournaments" className="font-semibold text-primary-strong hover:underline">
            다가오는 대회
          </Link>{" "}
          탭에서 확인하세요.
        </p>
      </header>

      <ShopExplorer shops={shops} />
    </div>
  );
}
