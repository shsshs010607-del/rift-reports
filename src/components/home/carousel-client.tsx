"use client";

import { Children, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * 프로모 캐러셀 — 한 번에 1장, 번호로 넘긴다.
 * 슬라이드는 서버에서 렌더된 children 을 그대로 감싼다.
 */
export function CarouselClient({ children }: { children: React.ReactNode }) {
  const slides = Children.toArray(children);
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function go(i: number) {
    const track = trackRef.current;
    const first = track?.children[0] as HTMLElement | undefined;
    const child = track?.children[i] as HTMLElement | undefined;
    if (track && first && child) {
      track.scrollTo({ left: child.offsetLeft - first.offsetLeft });
    }
    setActive(i);
  }

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const kids = Array.from(track.children) as HTMLElement[];
        if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) {
          setActive(kids.length - 1);
          return;
        }
        const base = kids[0]?.offsetLeft ?? 0;
        const left = track.scrollLeft;
        let nearest = 0;
        let best = Infinity;
        kids.forEach((k, i) => {
          const dist = Math.abs(k.offsetLeft - base - left);
          if (dist < best) {
            best = dist;
            nearest = i;
          }
        });
        setActive(nearest);
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section>
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((node, i) => (
          <div key={i} className="min-w-0 shrink-0 basis-full snap-start">
            {node}
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="mt-2.5 flex items-center justify-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`${i + 1}번 배너`}
              aria-current={active === i}
              className={cn(
                "grid h-7 w-7 place-items-center rounded-full text-label-sm font-bold transition",
                active === i
                  ? "bg-primary text-white"
                  : "bg-subcanvas text-ink-soft hover:bg-primary/10 hover:text-primary-strong",
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
