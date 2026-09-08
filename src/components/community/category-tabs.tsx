import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { COMMUNITY_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { metaFor } from "./category-meta";

/**
 * 게시판 전환 탭 스트립 — 커뮤니티 어디서나 한 번에 게시판 이동.
 * `active` 는 카테고리 slug (허브에선 undefined = 전체).
 */
export function CategoryTabs({ active }: { active?: string }) {
  const tabs = [
    { slug: "", label: "전체", href: "/community", Icon: LayoutGrid },
    ...COMMUNITY_CATEGORIES.map((c) => ({
      slug: c.slug,
      label: c.label,
      href: `/community/${c.slug}`,
      Icon: metaFor(c.slug).icon,
    })),
  ];

  return (
    <nav className="-mx-1 mb-5 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map(({ slug, label, href, Icon }) => {
        const on = (active ?? "") === slug;
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-label-md font-bold transition",
              on
                ? "border-primary bg-primary text-white shadow-sm"
                : "border-line bg-card text-ink-soft hover:border-primary/40 hover:text-ink",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
