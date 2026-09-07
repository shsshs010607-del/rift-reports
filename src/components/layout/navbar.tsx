"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Search, PenSquare } from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { NotificationBell } from "@/components/layout/notification-bell";
import { LogoMark } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { User } from "@supabase/supabase-js";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!hasSupabaseEnv) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setUser(session?.user ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-surface/90 shadow-header backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between gap-space-md px-gutter-desktop">
        <div className="flex items-center gap-space-lg">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <LogoMark className="h-9 w-auto rounded-lg shadow-e1" />
            <span className="font-display text-headline-sm font-extrabold tracking-tight text-on-surface">
              리프트 리포트
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 rounded-full bg-surface-container-lowest px-1.5 py-1 shadow-xs xl:flex">
            {NAV_ITEMS.filter((i) => i.href !== "/").map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-space-xs text-label-md transition-all",
                  isActive(item.href)
                    ? "bg-surface-container-high font-bold text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-space-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const term = q.trim();
              if (term) router.push(`/community?q=${encodeURIComponent(term)}`);
            }}
            className="relative hidden items-center lg:flex"
          >
            <Search className="pointer-events-none absolute left-space-sm h-4 w-4 text-outline" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="커뮤니티 검색…"
              className="w-36 rounded-full bg-surface-container-lowest py-space-xs pl-10 pr-4 text-body-sm text-on-surface shadow-xs placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary-container xl:w-44 2xl:w-56"
            />
          </form>

          <NotificationBell />

          <Link href="/community/new" className="hidden sm:inline-flex btn-primary !py-2 !text-label-md">
            <PenSquare className="h-[18px] w-[18px]" />
            <span>새 글 쓰기</span>
          </Link>

          {user ? (
            <Link
              href="/me"
              className="flex items-center gap-space-xs rounded-full bg-surface-container-lowest py-1 pl-1 pr-3 shadow-xs"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-fixed text-label-md font-bold text-on-primary-fixed-variant ring-1 ring-outline-variant">
                {(user.email ?? "U")[0].toUpperCase()}
              </span>
              <span className="hidden text-label-md font-bold leading-tight text-on-surface sm:block">
                내 프로필
              </span>
            </Link>
          ) : (
            <Link href="/login" className="hidden sm:inline-flex btn-ghost !py-2 !text-label-md">
              로그인
            </Link>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full border-2 border-outline-variant xl:hidden"
            aria-label="메뉴"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-outline-variant/60 bg-surface xl:hidden">
          <nav className="mx-auto flex max-w-[1280px] flex-col px-gutter-desktop py-space-sm">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-xl px-space-sm py-space-sm text-title-md transition-colors",
                  isActive(item.href)
                    ? "bg-surface-container-high font-bold text-primary"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link href={user ? "/me" : "/login"} className="btn-primary mt-space-xs">
              {user ? "내 프로필" : "로그인"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
