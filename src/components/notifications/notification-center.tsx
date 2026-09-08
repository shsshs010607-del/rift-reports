"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Megaphone, Sparkles, CalendarDays, Trash2, Check, BellOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  dismissNotification,
  clearAllNotifications,
  markNotificationsSeen,
} from "@/app/notifications/actions";
import { fmtKstShort } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/types/database";

const KIND = {
  notice: { icon: Megaphone, label: "공지" },
  update: { icon: Sparkles, label: "업데이트" },
  event: { icon: CalendarDays, label: "이벤트" },
} as const;

export function NotificationCenter({
  initialItems,
  seenAt,
  signedIn,
}: {
  initialItems: Notification[];
  seenAt: string | null;
  signedIn: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [pending, start] = useTransition();
  const seen = seenAt ? new Date(seenAt).getTime() : 0;

  if (!signedIn) {
    return (
      <p className="rounded-2xl border border-line/70 bg-card p-10 text-center text-body-md text-ink-soft">
        <Link href="/login?next=/notifications" className="font-bold text-primary-strong">
          로그인
        </Link>{" "}
        하면 받은 알림을 관리할 수 있어요.
      </p>
    );
  }

  const removeOne = (id: string) => {
    setItems((v) => v.filter((n) => n.id !== id));
    start(() => void dismissNotification(id));
  };

  const clearAll = () => {
    if (!confirm("받은 알림을 모두 삭제할까요? (내 화면에서만 사라집니다)")) return;
    setItems([]);
    start(() => void clearAllNotifications());
  };

  const markSeen = () => start(() => void markNotificationsSeen());

  return (
    <div className="flex flex-col gap-3">
      {items.length > 0 && (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={markSeen}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-label-sm font-bold text-ink-soft transition hover:text-ink disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" /> 모두 읽음
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-label-sm font-bold text-error transition hover:bg-error/10 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> 전체 삭제
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <p className="grid place-items-center gap-2 rounded-2xl border border-line/70 bg-card p-12 text-center text-body-md text-ink-soft">
          <BellOff className="h-7 w-7" />
          받은 알림이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((n) => {
            const meta = KIND[n.kind] ?? KIND.notice;
            const Icon = meta.icon;
            const isNew = new Date(n.created_at).getTime() > seen;
            return (
              <li
                key={n.id}
                className={cn(
                  "flex gap-3 rounded-2xl border p-4",
                  isNew ? "border-primary/30 bg-primary/[0.04]" : "border-line/70 bg-card",
                )}
              >
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-subcanvas px-1.5 py-0.5 text-[11px] font-bold text-ink-soft">
                      {meta.label}
                    </span>
                    {isNew && (
                      <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-black text-white">
                        NEW
                      </span>
                    )}
                    <time className="ml-auto text-label-sm text-ink-soft" dateTime={n.created_at}>
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ko })}
                    </time>
                  </div>
                  <p className="mt-1 text-body-lg font-bold text-ink">{n.title}</p>
                  {n.body && (
                    <p className="mt-1 whitespace-pre-wrap text-body-md leading-relaxed text-ink-soft">
                      {n.body}
                    </p>
                  )}
                  <p className="mt-1.5 text-label-sm text-ink-soft">{fmtKstShort(n.created_at)}</p>
                  {n.href && (
                    <Link
                      href={n.href}
                      className="mt-2 inline-flex text-label-md font-bold text-primary-strong hover:underline"
                    >
                      자세히 보기 →
                    </Link>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeOne(n.id)}
                  disabled={pending}
                  aria-label="삭제"
                  className="h-fit shrink-0 rounded-lg p-1.5 text-ink-soft transition hover:bg-error/10 hover:text-error disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-1 text-body-sm text-ink-soft">
        ※ 알림은 전체 공지라 삭제해도 내 화면에서만 숨겨집니다.
      </p>
    </div>
  );
}
