"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Megaphone, Sparkles, CalendarDays, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/types/database";

type Feed = { items: Notification[]; unread: number; signedIn: boolean };

const KIND_ICON = {
  notice: Megaphone,
  update: Sparkles,
  event: CalendarDays,
} as const;

export function NotificationBell() {
  const [feed, setFeed] = useState<Feed>({ items: [], unread: 0, signedIn: false });
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (res.ok) setFeed(await res.json());
    } catch {
      /* 무시 */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 120_000);
    return () => clearInterval(t);
  }, [load]);

  // 바깥 클릭 닫기
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const markSeen = useCallback(async () => {
    if (!feed.signedIn || feed.unread === 0 || !hasSupabaseEnv) return;
    setFeed((f) => ({ ...f, unread: 0 }));
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user)
        await supabase
          .from("profiles")
          .update({ notifications_seen_at: new Date().toISOString() })
          .eq("id", user.id);
    } catch {
      /* 무시 */
    }
  }, [feed.signedIn, feed.unread]);

  const toggle = () => {
    setOpen((v) => {
      const next = !v;
      if (next) void markSeen();
      return next;
    });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="알림"
        onClick={toggle}
        className="relative grid h-10 w-10 place-items-center rounded-full bg-surface-container-lowest text-on-surface-variant shadow-xs transition-colors hover:text-on-surface"
      >
        <Bell className="h-[18px] w-[18px]" />
        {feed.unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-error px-1 text-[10px] font-black leading-none text-white ring-2 ring-surface-container-lowest">
            {feed.unread > 9 ? "9+" : feed.unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(94vw,400px)] overflow-hidden rounded-2xl border border-outline-variant bg-surface shadow-e3">
          <div className="flex items-center justify-between border-b border-outline-variant/60 px-4 py-3">
            <span className="font-display text-headline-sm font-bold text-on-surface">알림</span>
            {feed.signedIn && feed.items.length > 0 && (
              <button
                type="button"
                onClick={markSeen}
                className="inline-flex items-center gap-1 text-label-sm font-bold text-on-surface-variant hover:text-primary"
              >
                <Check className="h-3.5 w-3.5" />
                모두 읽음
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {feed.items.length === 0 ? (
              <p className="px-4 py-10 text-center text-body-sm text-on-surface-variant">
                새 알림이 없습니다.
              </p>
            ) : (
              <ul className="divide-y divide-outline-variant/40">
                {feed.items.map((n) => {
                  const Icon = KIND_ICON[n.kind] ?? Megaphone;
                  const inner = (
                    <>
                      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-body-lg font-bold leading-snug text-on-surface">
                          {n.title}
                        </span>
                        {n.body && (
                          <span className="mt-1 block whitespace-pre-wrap text-body-md leading-snug text-on-surface-variant">
                            {n.body}
                          </span>
                        )}
                        <span className="mt-1.5 block text-body-sm text-on-surface-variant">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ko })}
                        </span>
                      </span>
                    </>
                  );
                  return (
                    <li key={n.id}>
                      {n.href ? (
                        <Link
                          href={n.href}
                          onClick={() => setOpen(false)}
                          className="flex gap-3 px-4 py-3.5 transition-colors hover:bg-surface-container-low"
                        >
                          {inner}
                        </Link>
                      ) : (
                        <div className="flex gap-3 px-4 py-3.5">{inner}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {!feed.signedIn && (
            <div className="border-t border-outline-variant/60 px-4 py-2.5 text-center">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="text-label-md font-bold text-primary"
              >
                로그인하고 알림 받기
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
