"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Search, PenSquare, Home, ChevronDown } from "lucide-react";
import { NAV_PRIMARY, NAV_SECONDARY, SITE } from "@/lib/constants";
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
      {/* ── 1행: 로고 · 주요 메뉴 · 알림/글쓰기/프로필 ── */}
      <div className="mx-auto flex h-[68px] max-w-[1280px] items-center gap-4 px-gutter-desktop">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <LogoMark className="h-10 w-auto rounded-lg shadow-e1" />
          <span className="font-display text-headline-sm font-extrabold tracking-tight text-on-surface sm:text-headline-md">
            리바지지
          </span>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 xl:flex">
          {NAV_PRIMARY.map((item) => (
            <NavPill
              key={item.href}
              href={item.href}
              label={item.label}
              sub={item.children}
              active={isActive(item.href)}
            />
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2.5 xl:flex-none">
          <NotificationBell />

          <Link
            href="/community/new"
            className="hidden items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-body-md font-bold text-white shadow-[0_4px_14px_rgba(70,72,212,0.3)] transition hover:bg-primary-container sm:inline-flex"
          >
            <PenSquare className="h-[18px] w-[18px]" />
            <span className="hidden lg:inline">새 글 쓰기</span>
          </Link>

          {user ? (
            <Link
              href="/me"
              className="flex items-center gap-2 rounded-full bg-surface-container-lowest py-1 pl-1 pr-3 shadow-xs"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-fixed text-body-md font-bold text-on-primary-fixed-variant ring-1 ring-outline-variant">
                {(user.email ?? "U")[0].toUpperCase()}
              </span>
              <span className="hidden text-body-md font-bold leading-tight text-on-surface lg:block">
                내 프로필
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-full bg-surface-container-high px-4 py-2.5 text-body-md font-bold text-primary transition hover:bg-surface-container-highest sm:inline-flex"
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

      {/* ── 2행: 보조 메뉴(좌) · 검색(우) ── */}
      <div className="hidden border-t border-outline-variant/40 bg-surface-container-low/40 xl:block">
        <div className="mx-auto flex h-[48px] max-w-[1280px] items-center justify-between gap-4 px-gutter-desktop">
          <nav className="flex items-center gap-1">
            <Link
              href="/"
              aria-current={isActive("/") ? "page" : undefined}
              aria-label="홈"
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-body-sm transition-all",
                isActive("/")
                  ? "bg-surface-container-high font-bold text-primary"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
              )}
            >
              <Home className="h-4 w-4" />
            </Link>
            {NAV_SECONDARY.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-body-sm transition-all",
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
              className="w-48 rounded-full bg-surface-container-lowest py-1.5 pl-10 pr-4 text-body-sm text-on-surface shadow-xs placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary-container 2xl:w-60"
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
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-space-sm py-space-sm text-title-md transition-colors",
                isActive("/")
                  ? "bg-surface-container-high font-bold text-primary"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
              )}
            >
              <Home className="h-[18px] w-[18px]" />홈
            </Link>
            {[...NAV_PRIMARY, ...NAV_SECONDARY].map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block rounded-xl px-space-sm py-space-sm text-title-md transition-colors",
                    isActive(item.href)
                      ? "bg-surface-container-high font-bold text-primary"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
                  )}
                >
                  {item.label}
                </Link>
                {"children" in item &&
                  item.children?.map((s) => {
                    const { url, external, disabled } = subHref(s.href);
                    if (disabled)
                      return (
                        <span
                          key={s.href}
                          className="block px-space-sm py-2 pl-8 text-body-md text-on-surface-variant/60"
                        >
                          {s.label} · 준비 중
                        </span>
                      );
                    return (
                      <Link
                        key={s.href}
                        href={url}
                        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        onClick={() => setOpen(false)}
                        className="block px-space-sm py-2 pl-8 text-body-md text-on-surface-variant hover:text-on-surface"
                      >
                        {s.label}
                      </Link>
                    );
                  })}
              </div>
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

type SubItem = { href: string; label: string };

/** report: 센티널 → 디스코드 신고 게시판. 아직 URL 없으면 비활성. */
function subHref(href: string): { url: string; external: boolean; disabled: boolean } {
  if (href === "report:") {
    const ready = SITE.discordReport && SITE.discordReport !== "#";
    return { url: ready ? SITE.discordReport : "#", external: true, disabled: !ready };
  }
  return { url: href, external: false, disabled: false };
}

function NavPill({
  href,
  label,
  active,
  sub,
}: {
  href: string;
  label: string;
  active: boolean;
  sub?: readonly SubItem[];
}) {
  const [open, setOpen] = useState(false);

  const pillCls = cn(
    "whitespace-nowrap rounded-full px-3.5 py-2 text-body-md transition-all",
    active
      ? "bg-surface-container-high font-bold text-primary"
      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
  );

  if (!sub?.length) {
    return (
      <Link href={href} aria-current={active ? "page" : undefined} className={pillCls}>
        {label}
      </Link>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className={cn("flex items-center", pillCls, "gap-0.5 pr-2")}>
        <Link href={href} aria-current={active ? "page" : undefined} className="hover:underline">
          {label}
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={`${label} 하위 메뉴`}
          className="grid h-5 w-5 place-items-center rounded-full hover:bg-surface-container-high"
        >
          <ChevronDown className={cn("h-3.5 w-3.5 transition", open && "rotate-180")} />
        </button>
      </div>

      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 min-w-[160px] overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest py-1 shadow-e2">
          {sub.map((s) => {
            const { url, external, disabled } = subHref(s.href);
            if (disabled) {
              return (
                <span
                  key={s.href}
                  className="flex items-center justify-between px-3.5 py-2 text-body-sm text-on-surface-variant/60"
                >
                  {s.label}
                  <span className="text-label-sm">준비 중</span>
                </span>
              );
            }
            return (
              <Link
                key={s.href}
                href={url}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                onClick={() => setOpen(false)}
                className="block px-3.5 py-2 text-body-sm text-on-surface transition-colors hover:bg-surface-container hover:text-primary"
              >
                {s.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
