import Image from "next/image";
import { Play, Youtube } from "lucide-react";
import { SITE, RIFTBOUND_VIDEOS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** 리프트바운드 영상 미리보기 (홈 중단). */
export function OfficialLinks({ className }: { className?: string }) {
  return (
    <section className={cn("", className)}>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="section-title">리프트바운드 영상</h2>
        <a
          href={SITE.officialYoutube}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-label-md font-bold text-[#FF0033] hover:underline"
        >
          <Youtube className="h-4 w-4" />
          공식 채널
        </a>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {RIFTBOUND_VIDEOS.map((v) => (
          <a
            key={v.id}
            href={`https://www.youtube.com/watch?v=${v.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group overflow-hidden rounded-2xl border border-line/70 bg-card transition hover:-translate-y-0.5 hover:border-[#FF0033]/40 hover:shadow-e2"
          >
            <div className="relative aspect-video overflow-hidden bg-subcanvas">
              <Image
                src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`}
                alt={v.titleKo}
                fill
                sizes="(max-width:640px) 100vw, 320px"
                className="object-cover transition group-hover:scale-[1.03]"
              />
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm transition group-hover:bg-[#FF0033]">
                  <Play className="h-5 w-5 fill-current" />
                </span>
              </span>
            </div>
            <div className="p-3">
              <p className="line-clamp-2 text-body-md font-bold leading-snug text-ink group-hover:text-[#FF0033]">
                {v.titleKo}
              </p>
              <p className="mt-0.5 text-label-sm text-ink-soft">{v.channel}</p>
            </div>
          </a>
        ))}

        <a
          href={SITE.officialSite}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-subcanvas/40 p-4 text-body-md font-bold text-ink-soft transition hover:border-primary/40 hover:text-primary-strong sm:col-span-2 lg:col-span-1"
        >
          공식 홈페이지 →
        </a>
      </div>
    </section>
  );
}
