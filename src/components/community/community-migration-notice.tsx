import { Megaphone, ArrowUpRight } from "lucide-react";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * 커뮤니티 통합 안내 — 커뮤니티는 네이버 카페 자유게시판으로 통합(목록은 여기서 연동 표시).
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
        <strong className="text-ink">커뮤니티 통합 안내</strong> — 리바지지 커뮤니티가 네이버 카페
        자유게시판으로 통합됩니다. 카페 새 글이 여기에도 바로 올라오고, 글쓰기·댓글은 카페에서
        해주세요. 예전 글은 그대로 볼 수 있어요.
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
