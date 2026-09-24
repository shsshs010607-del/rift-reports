"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X, Search, PenSquare, Home, ChevronDown } from "lucide-react";
import { SITE } from "@/lib/constants";
import { NAV_GROUPS, type NavGroup, type NavItem } from "@/lib/nav-groups";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ThemeToggle } from "@/components/layout/theme-toggle";
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

  // /cards 와 /cards/proxy 처럼 접두사가 겹치면 가장 긴 경로만 활성으로 본다.
  const bestPath = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href.split("?")[0]))
    .filter((h) => h.startsWith("/") && !h.endsWith(".html") && isActive(h))
    .sort((a, b) => b.length - a.length)[0];
  const itemActive = (href: string) => !!bestPath && href.split("?")[0] === bestPath;
  const groupActive = (g: NavGroup) => g.items.some((i) => itemActive(i.href));

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (term) router.push(`/community?q=${encodeURIComponent(term)}`);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-surface/95 shadow-header backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-[1280px] items-center gap-2 px-4 sm:gap-4 sm:px-gutter-desktop">
        <Link href="/" aria-label="리바지지 홈" className="flex shrink-0 items-center">
          <LogoMark className="shadow-e1" />
        </Link>

        <nav className="hidden flex-1 items-center gap-0.5 xl:flex">
          {NAV_GROUPS.map((g) => (
            <GroupMenu key={g.label} group={g} active={groupActive(g)} itemActive={itemActive} />
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2.5 xl:flex-none">
          <form onSubmit={submitSearch} className="relative hidden items-center xl:flex">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-outline" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="커뮤니티 검색…"
              className="w-36 rounded-full bg-surface-container-lowest py-2 pl-9 pr-3 text-body-sm text-on-surface shadow-xs placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary-container 2xl:w-52"
            />
          </form>
          <ThemeToggle />
          <NotificationBell />

          <a
            href={SITE.naverCafeBoardByCategory.riftbound}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-body-md font-bold text-white shadow-[0_4px_14px_rgba(70,72,212,0.3)] transition hover:bg-primary-container sm:inline-flex"
          >
            <PenSquare className="h-[18px] w-[18px]" />
            <span className="hidden lg:inline xl:hidden 2xl:inline">카페에 글쓰기</span>
          </a>

          {user ? (
            <Link
              href="/me"
              className="flex items-center gap-2 rounded-full bg-surface-container-lowest py-1 pl-1 pr-3 shadow-xs"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-fixed text-body-md font-bold text-on-primary-fixed-variant ring-1 ring-outline-variant">
                {(user.email ?? "U")[0].toUpperCase()}
              </span>
              <span className="hidden text-body-md font-bold leading-tight text-on-surface lg:block xl:hidden 2xl:block">
                내 프로필
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-lg bg-surface-container-high px-4 py-2.5 text-body-md font-bold text-primary transition hover:bg-surface-container-highest sm:inline-flex"
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

      {/* ── 모바일 메뉴: 기능별 묶음 ── */}
      {open && (
        <div className="max-h-[calc(100vh-68px)] overflow-y-auto border-t border-outline-variant/60 bg-surface xl:hidden">
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
            {NAV_GROUPS.map((g) => (
              <div key={g.label} className="mt-2">
                <div className="px-space-sm pb-1 text-label-sm font-bold uppercase tracking-wide text-outline">
                  {g.label}
                </div>
                {g.items.map((item) => {
                  const { url, external, disabled } = subHref(item.href);
                  if (disabled)
                    return (
                      <span
                        key={item.href}
                        className="block px-space-sm py-2 text-body-md text-on-surface-variant/60"
                      >
                        {item.label} · 준비 중
                      </span>
                    );
                  const cls = cn(
                    "block rounded-xl px-space-sm py-2.5 text-body-lg transition-colors",
                    itemActive(item.href)
                      ? "bg-surface-container-high font-bold text-primary"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
                  );
                  return external ? (
                    <a key={item.href} href={url} target="_blank" rel="noopener noreferrer" className={cls}>
                      {item.label}
                    </a>
                  ) : (
                    <Link key={item.href} href={url} onClick={() => setOpen(false)} className={cls}>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
            <Link
              href={user ? "/me" : "/login"}
              onClick={() => setOpen(false)}
              className="btn-primary mt-space-sm"
            >
              {user ? "내 프로필" : "로그인"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

/** report: 센티널 → 디스코드 신고 게시판. 아직 URL 없으면 비활성. */
function subHref(href: string): { url: string; external: boolean; disabled: boolean } {
  if (href === "report:") {
    const ready = SITE.discordReport && SITE.discordReport !== "#";
    return { url: ready ? SITE.discordReport : "#", external: true, disabled: !ready };
  }
  // 정적 HTML 페이지(예: /origins-sim.html)는 앱 라우터가 아니라 새 탭으로 연다.
  if (href.endsWith(".html")) {
    return { url: href, external: true, disabled: false };
  }
  return { url: href, external: false, disabled: false };
}

function GroupMenu({
  group,
  active,
  itemActive,
}: {
  group: NavGroup;
  active: boolean;
  itemActive: (href: string) => boolean;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const openNow = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const closeSoon = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <button
        type="button"
        onClick={() => {
          clearTimeout(closeTimer.current);
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-body-md transition-all 2xl:px-4",
          active
            ? "bg-surface-container-high font-bold text-primary"
            : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
        )}
      >
        {group.label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition", open && "rotate-180")} />
      </button>

      {open && (
        // pt-2 = 버튼과 메뉴 사이를 hover 가능한 다리로 만들어 메뉴가 닫히지 않게 한다.
        <div className="absolute left-0 top-full z-50 pt-2">
          <div className="min-w-[210px] overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest py-1 shadow-e2">
            {group.items.map((item) => (
              <MenuItem key={item.href} item={item} active={itemActive(item.href)} onNavigate={() => setOpen(false)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate: () => void;
}) {
  const { url, external, disabled } = subHref(item.href);
  if (disabled) {
    return (
      <span className="flex items-center justify-between px-3.5 py-2 text-body-sm text-on-surface-variant/60">
        {item.label}
        <span className="text-label-sm">준비 중</span>
      </span>
    );
  }
  const cls = cn(
    "block px-3.5 py-2 transition-colors hover:bg-surface-container",
    active ? "text-primary" : "text-on-surface",
  );
  const body = (
    <>
      <span className={cn("block text-body-md", active && "font-bold")}>{item.label}</span>
      {item.desc && <span className="block text-label-sm text-on-surface-variant">{item.desc}</span>}
    </>
  );
  return external ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className={cls}>
      {body}
    </a>
  ) : (
    <Link href={url} onClick={onNavigate} className={cls} aria-current={active ? "page" : undefined}>
      {body}
    </Link>
  );
}
