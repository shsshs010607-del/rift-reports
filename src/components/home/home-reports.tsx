import Link from "next/link";
import { Newspaper } from "lucide-react";

import { getPosts } from "@/lib/community";
import { fmtKstRelative } from "@/lib/datetime";

/** 홈 우측 — 리프트 리포트(리포트 게시판) 글. 최신순. */
export async function HomeReports() {
  const { posts } = await getPosts({ category: "report", page: 1 });
  const list = posts.slice(0, 6);

  return (
    <div className="note-card p-4 pr-6">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-label-lg font-bold text-ink">
          <Newspaper className="h-4 w-4 text-primary" />
          리프트 리포트
        </h3>
        <Link
          href="/community/report"
          className="text-label-sm text-ink-soft hover:text-primary-strong"
        >
          더보기
        </Link>
      </div>

      {list.length === 0 ? (
        <p className="py-6 text-center text-body-sm text-ink-soft">
          메타 분석 · 뉴스 · 번역 글이 올라옵니다.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-line/40">
          {list.map((p) => (
            <li key={p.id}>
              <Link
                href={`/community/post/${p.id}`}
                className="flex items-center gap-2 py-2 hover:text-primary-strong"
              >
                <span className="min-w-0 flex-1 truncate text-body-md text-ink">{p.title}</span>
                <time className="shrink-0 text-[12px] text-ink-soft">
                  {fmtKstRelative(p.created_at)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
