import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { SectionHeader, EmptyState } from "@/components/ui/section-header";
import type { Report } from "@/lib/types/database";

export function ReportHighlights({ reports }: { reports: Report[] }) {
  const [lead, ...rest] = reports;

  return (
    <section>
      <SectionHeader
        title="최신 리포트"
        description="메타 분석 · 뉴스 · 신규 카드 리뷰"
        href="/reports"
      />
      {reports.length === 0 ? (
        <EmptyState message="아직 발행된 리포트가 없습니다." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* 리드 아티클 */}
          <Link
            href={`/reports/${lead.slug}`}
            className="surface surface-hover group flex flex-col overflow-hidden"
          >
            <div className="relative aspect-[16/9] w-full bg-subcanvas">
              {lead.cover_image_url && (
                <Image
                  src={lead.cover_image_url}
                  alt=""
                  fill
                  sizes="(max-width:1024px) 100vw, 50vw"
                  className="object-cover transition group-hover:scale-[1.02]"
                />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2 p-5">
              {lead.tag && <span className="chip w-fit">{lead.tag}</span>}
              <h3 className="font-display text-headline-sm text-ink">{lead.title}</h3>
              {lead.excerpt && <p className="line-clamp-2 text-body-md text-ink-soft">{lead.excerpt}</p>}
              <time className="mt-auto pt-2 text-body-sm text-ink-soft">
                {lead.published_at &&
                  formatDistanceToNow(new Date(lead.published_at), { addSuffix: true, locale: ko })}
              </time>
            </div>
          </Link>

          {/* 서브 리스트 */}
          <ul className="flex flex-col gap-3">
            {rest.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/reports/${r.slug}`}
                  className="surface surface-hover flex gap-4 p-3"
                >
                  <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-xl bg-subcanvas">
                    {r.cover_image_url && (
                      <Image src={r.cover_image_url} alt="" fill sizes="96px" className="object-cover" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col gap-1 py-1">
                    {r.tag && <span className="text-label-sm uppercase text-primary-strong">{r.tag}</span>}
                    <p className="line-clamp-2 font-display text-title-md text-ink">{r.title}</p>
                    <time className="mt-auto text-body-sm text-ink-soft">
                      {r.published_at &&
                        formatDistanceToNow(new Date(r.published_at), { addSuffix: true, locale: ko })}
                    </time>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
