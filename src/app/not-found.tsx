import Link from "next/link";
import { ArrowRight } from "lucide-react";

const LINKS = [
  { href: "/", label: "홈" },
  { href: "/cards", label: "카드 정보" },
  { href: "/tiers", label: "덱 티어리스트" },
  { href: "/community", label: "커뮤니티" },
];

export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-md place-items-center py-24 text-center">
      <p className="font-display text-display-hero leading-none text-primary">404</p>
      <p className="mt-3 text-body-lg text-ink-soft">요청하신 페이지를 찾을 수 없습니다.</p>
      <Link href="/" className="btn-primary mt-6">
        홈으로
      </Link>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-label-sm font-bold text-ink-soft transition hover:border-primary/40 hover:text-ink"
          >
            {l.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ))}
      </div>
    </div>
  );
}
