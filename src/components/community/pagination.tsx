import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  total,
  perPage,
  hrefFor,
}: {
  page: number;
  total: number;
  perPage: number;
  hrefFor: (page: number) => string;
}) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;

  const start = Math.max(1, page - 2);
  const end = Math.min(pages, start + 4);
  const nums = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <nav className="mt-6 flex items-center justify-center gap-1">
      <Link
        href={hrefFor(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={cn(
          "grid h-9 w-9 place-items-center rounded-lg border border-line",
          page === 1 && "pointer-events-none opacity-40",
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>
      {nums.map((n) => (
        <Link
          key={n}
          href={hrefFor(n)}
          className={cn(
            "grid h-9 min-w-9 place-items-center rounded-lg px-2 text-label-lg",
            n === page ? "bg-primary text-white" : "border border-line text-ink-soft hover:bg-subcanvas",
          )}
        >
          {n}
        </Link>
      ))}
      <Link
        href={hrefFor(Math.min(pages, page + 1))}
        aria-disabled={page === pages}
        className={cn(
          "grid h-9 w-9 place-items-center rounded-lg border border-line",
          page === pages && "pointer-events-none opacity-40",
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
