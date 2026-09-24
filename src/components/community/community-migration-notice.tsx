import { Megaphone, ArrowUpRight } from "lucide-react";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * 게시판 개편 안내 — 새 글쓰기는 네이버 카페 자유게시판으로 이동, 여기는 정보 전달용.
 * 기존 글은 그대로 보이니 삭제 안내는 아님.
 */
export function CommunityMigrationNotice({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-xl border border-[#03C75A]/25 bg-[#03C75A]/[0.06] px-3.5 py-2.5 text-body-sm text-ink-soft",
        className,
      )}
    >
      <Megaphone className="h-4 w-4 shrink-0 text-[#03C75A]" />
      <p className="min-w-0 flex-1">
        <strong className="text-ink">게시판 개편 안내</strong> — 이제부터 새 글은 네이버 카페
        자유게시판에서 써주세요. 여기 있던 글은 그대로 볼 수 있어요.
      </p>
      <a
        href={SITE.naverCafeBoardByCategory.riftbound}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center gap-1 font-bold text-[#03C75A] hover:underline"
      >
        카페 자유게시판 가기
        <ArrowUpRight className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
