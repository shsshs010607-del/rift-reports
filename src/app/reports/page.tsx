import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { fmtKstDate } from "@/lib/datetime";
import { PageHeading } from "@/components/ui/page-heading";
import { getReports } from "@/lib/queries";

export const metadata: Metadata = { title: "리포트" };
export const revalidate = 120;

export default async function ReportsListPage() {
  const reports = await getReports();

  return (
    <div>
      <PageHeading title="리포트" description="메타 분석 · 뉴스 · 카드 리뷰" />

      {reports.length === 0 ? (
        <p className="rounded-2xl border border-line bg-card p-10 text-center text-body-md text-ink-soft">
          아직 발행된 리포트가 없습니다.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {reports.map((r) => (
            <li key={r.id}>
              <Link
                href={`/reports/${r.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line/80 bg-card transition hover:border-primary/50"
              >
                <div className="relative aspect-[16/9] bg-subcanvas">
                  {r.cover_image_url && (
                    <Image
                      src={r.cover_image_url}
                      alt=""
                      fill
                      sizes="(max-width:640px) 100vw, 400px"
                      className="object-cover transition group-hover:scale-[1.02]"
                    />
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  {r.tag && <span className="chip w-fit">{r.tag}</span>}
                  <h2 className="font-display text-title-lg font-bold text-ink">{r.title}</h2>
                  {r.excerpt && (
                    <p className="line-clamp-2 text-body-sm text-ink-soft">{r.excerpt}</p>
                  )}
                  <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 text-body-sm text-ink-soft">
                    <span className="font-semibold text-ink">
                      {r.author?.username ?? "리바지지"}
                    </span>
                    {r.published_at && (
                      <time dateTime={r.published_at}>
                        {fmtKstDate(r.published_at)}
                      </time>
                    )}
                    <span>· 조회 {r.view_count}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
