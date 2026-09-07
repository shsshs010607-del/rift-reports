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

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (term) router.push(`/community?q=${encodeURIComponent(term)}`);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-surface/95 shadow-header backdrop-blur-xl">
      {/* ── 1행: 로고 · 알림 · 글쓰기 · 프로필 ── */}
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between gap-4 px-gutter-desktop">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <LogoMark className="h-11 w-auto rounded-lg shadow-e1" />
          <span className="font-display text-headline-md font-extrabold tracking-tight text-on-surface">
            리프트 리포트
          </span>
        </Link>

        <div className="flex items-center gap-2.5">
          <NotificationBell />

          <Link
            href="/community/new"
            className="hidden items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-body-md font-bold text-white shadow-[0_4px_14px_rgba(70,72,212,0.3)] transition hover:bg-primary-container sm:inline-flex"
          >
            <PenSquare className="h-[18px] w-[18px]" />
            <span>새 글 쓰기</span>
          </Link>

          {user ? (
            <Link
              href="/me"
              className="flex items-center gap-2 rounded-full bg-surface-container-lowest py-1 pl-1 pr-3.5 shadow-xs"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-fixed text-body-md font-bold text-on-primary-fixed-variant ring-1 ring-outline-variant">
                {(user.email ?? "U")[0].toUpperCase()}
              </span>
              <span className="hidden text-body-md font-bold leading-tight text-on-surface sm:block">
                내 프로필
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-full bg-surface-container-high px-5 py-2.5 text-body-md font-bold text-primary transition hover:bg-surface-container-highest sm:inline-flex"
            >
              로그인
            </Link>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="grid h-11 w-11 place-items-center rounded-full border-2 border-outline-variant xl:hidden"
            aria-label="메뉴"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ── 2행: 내비게이션(좌) · 검색(우) ── */}
      <div className="hidden border-t border-outline-variant/40 xl:block">
        <div className="mx-auto flex h-[52px] max-w-[1280px] items-center justify-between gap-4 px-gutter-desktop">
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.filter((i) => i.href !== "/").map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap rounded-full px-3.5 py-2 text-body-md transition-all",
                  isActive(item.href)
                    ? "bg-surface-container-high font-bold text-primary"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <form onSubmit={submitSearch} className="relative flex shrink-0 items-center">
            <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-outline" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="커뮤니티 검색…"
              className="w-52 rounded-full bg-surface-container-lowest py-2 pl-10 pr-4 text-body-md text-on-surface shadow-xs placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary-container 2xl:w-64"
            />
          </form>
        </div>
      </div>

      {/* ── 모바일 메뉴 ── */}
      {open && (
        <div className="border-t border-outline-variant/60 bg-surface xl:hidden">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-1 px-gutter-desktop py-3">
            <form onSubmit={submitSearch} className="relative mb-1 flex items-center">
              <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-outline" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="커뮤니티 검색…"
                className="w-full rounded-full bg-surface-container-lowest py-2.5 pl-10 pr-4 text-body-md text-on-surface shadow-xs placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary-container"
              />
            </form>
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
            <Link
              href={user ? "/me" : "/login"}
              onClick={() => setOpen(false)}
              className="btn-primary mt-space-xs"
            >
              {user ? "내 프로필" : "로그인"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
