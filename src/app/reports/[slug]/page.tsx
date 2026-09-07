import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft } from "lucide-react";
import { getReport } from "@/lib/queries";
import { ViewCounter } from "@/components/community/view-counter";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const report = await getReport(params.slug);
  if (!report) return { title: "리포트" };
  return {
    title: report.title,
    description: report.excerpt ?? undefined,
    openGraph: report.cover_image_url ? { images: [report.cover_image_url] } : undefined,
  };
}

export default async function ReportDetailPage({ params }: { params: { slug: string } }) {
  const report = await getReport(params.slug);
  if (!report) notFound();

  return (
    <article className="mx-auto max-w-3xl">
      <ViewCounter postId={report.id} table="reports" />

      <Link
        href="/reports"
        className="mb-4 inline-flex items-center gap-1 text-body-sm text-ink-soft hover:text-primary-strong"
      >
        <ChevronLeft className="h-4 w-4" />
        리포트
      </Link>

      {report.tag && <span className="chip">{report.tag}</span>}
      <h1 className="mt-2 font-display text-headline-lg text-ink">{report.title}</h1>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-ink-soft">
        <span className="font-semibold text-ink">{report.author?.username ?? "리프트 리포트"}</span>
        {report.published_at && (
          <time dateTime={report.published_at}>
            {format(new Date(report.published_at), "yyyy.MM.dd", { locale: ko })}
          </time>
        )}
        <span>조회 {report.view_count}</span>
      </div>

      {report.cover_image_url && (
        <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-2xl bg-subcanvas">
          <Image
            src={report.cover_image_url}
            alt=""
            fill
            sizes="(max-width:768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        </div>
      )}

      {report.excerpt && (
        <p className="mt-6 border-l-4 border-primary/40 pl-4 text-body-lg text-ink-soft">
          {report.excerpt}
        </p>
      )}

      <div className="mt-6 whitespace-pre-wrap text-body-lg leading-relaxed text-ink">
        {report.body}
      </div>
    </article>
  );
}
