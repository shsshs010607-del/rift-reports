import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Props {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}

export function SectionHeader({ title, description, href, linkLabel = "전체 보기" }: Props) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="section-title">{title}</h2>
        {description && <p className="mt-0.5 text-body-sm text-ink-soft">{description}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-label-lg text-primary-strong hover:bg-primary-wash"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="grid place-items-center rounded-xl border-2 border-dashed border-line bg-subcanvas/40 px-6 py-10 text-center">
      <p className="text-body-sm text-ink-soft">{message}</p>
    </div>
  );
}
