import Link from "next/link";
import { NAV_ITEMS, SITE } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line/70 bg-subcanvas/50">
      <div className="container flex flex-col gap-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <p className="font-display text-title-md font-extrabold text-ink">{SITE.name}</p>
          <p className="mt-1 text-body-sm text-ink-soft">{SITE.description}</p>
          <p className="mt-3 text-body-sm text-ink-soft">
            비공식 팬 사이트입니다. Riftbound / League of Legends 관련 자산의 저작권은 Riot Games 에 있습니다.
          </p>
        </div>
        <nav className="grid grid-cols-2 gap-x-10 gap-y-2">
          {NAV_ITEMS.filter((i) => i.href !== "/").map((item) => (
            <Link key={item.href} href={item.href} className="text-body-sm text-ink-soft hover:text-primary-strong">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-line/70 py-4">
        <p className="container text-body-sm text-ink-soft">
          © {new Date().getFullYear()} {SITE.nameEn}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
