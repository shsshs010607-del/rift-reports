import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getListing } from "@/lib/trading";
import { TRADING_CATEGORIES, TRADE_CONDITIONS, TRADE_STATUS } from "@/lib/constants";
import { ListingOwnerControls } from "@/components/trading/listing-owner-controls";

export const dynamic = "force-dynamic";

const CAT = new Map<string, string>(TRADING_CATEGORIES.map((c) => [c.slug, c.label]));
const COND = new Map<string, string>(TRADE_CONDITIONS.map((c) => [c.slug, c.label]));
const STATUS = new Map<string, string>(TRADE_STATUS.map((s) => [s.slug, s.label]));

export default async function TradeDetailPage({ params }: { params: { id: string } }) {
  const listing = await getListing(params.id);
  if (!listing) notFound();

  const supabase = createClient();
  const { data: userRes } = await supabase.auth.getUser();
  const isOwner = userRes.user?.id === listing.seller_id;
  const isLoggedIn = Boolean(userRes.user);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/trading"
        className="mb-4 inline-flex items-center gap-1 text-body-sm text-ink-soft hover:text-primary-strong"
      >
        <ChevronLeft className="h-4 w-4" />
        카드 거래
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <span className="chip">{CAT.get(listing.category)}</span>
        {listing.status !== "open" && (
          <span className="chip bg-subcanvas">{STATUS.get(listing.status)}</span>
        )}
      </div>

      <h1 className="mt-2 font-display text-headline-md text-ink">{listing.title}</h1>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-ink-soft">
        <span className="font-semibold text-ink">{listing.seller?.username ?? "알 수 없음"}</span>
        <time dateTime={listing.created_at}>
          {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true, locale: ko })}
        </time>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 rounded-2xl border border-line/80 bg-card p-4">
        <div>
          <dt className="text-body-sm text-ink-soft">가격</dt>
          <dd className="font-display text-title-lg font-bold text-ink">
            {listing.price != null ? `₩${listing.price.toLocaleString("ko-KR")}` : "협의"}
            {listing.is_negotiable && listing.price != null && (
              <span className="ml-1 text-body-sm font-normal text-ink-soft">협의 가능</span>
            )}
          </dd>
        </div>
        {listing.card_condition && (
          <div>
            <dt className="text-body-sm text-ink-soft">카드 상태</dt>
            <dd className="text-title-md text-ink">{COND.get(listing.card_condition)}</dd>
          </div>
        )}
        {listing.region && (
          <div>
            <dt className="text-body-sm text-ink-soft">지역</dt>
            <dd className="inline-flex items-center gap-1 text-title-md text-ink">
              <MapPin className="h-4 w-4 text-ink-soft" />
              {listing.region}
            </dd>
          </div>
        )}
      </dl>

      {listing.description && (
        <div className="mt-5 whitespace-pre-wrap rounded-2xl border border-line/80 bg-card p-4 text-body-md leading-relaxed text-ink">
          {isLoggedIn ? (
            listing.description
          ) : (
            <>
              <span className="blur-sm select-none">{listing.description}</span>
              <p className="mt-3 text-body-sm font-semibold text-primary-strong blur-none">
                <Link href={`/login?next=/trading/${listing.id}`} className="underline">
                  로그인
                </Link>
                하면 연락처를 포함한 전체 설명을 볼 수 있습니다.
              </p>
            </>
          )}
        </div>
      )}

      {isOwner && (
        <div className="mt-6">
          <ListingOwnerControls id={listing.id} status={listing.status} />
        </div>
      )}
    </div>
  );
}
