"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Bookmark, FolderOpen, Trash2, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { saveDeck, deleteSavedDeck, listMyDecks } from "@/lib/actions/decks";
import type { SavedDeck } from "@/lib/types/database";
import { cn } from "@/lib/utils";

export function SaveDeckControls({
  deckName,
  code,
  legendName,
  empty,
  onLoad,
}: {
  deckName: string;
  code: string | null;
  legendName: string | null;
  empty: boolean;
  onLoad: (code: string) => void;
}) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [decks, setDecks] = useState<SavedDeck[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!hasSupabaseEnv) return setSignedIn(false);
    createClient()
      .auth.getUser()
      .then(({ data }) => setSignedIn(Boolean(data.user)));
  }, []);

  function refresh() {
    start(async () => setDecks(await listMyDecks()));
  }

  function onSave() {
    if (!code) {
      setMsg("카드를 더 추가하면 저장할 수 있어요.");
      return;
    }
    start(async () => {
      const res = await saveDeck({ name: deckName, code, legendName });
      setMsg(res.error ?? "저장했습니다.");
      if (!res.error) refresh();
      setTimeout(() => setMsg(null), 2500);
    });
  }

  function toggleList() {
    const next = !open;
    setOpen(next);
    if (next) refresh();
  }

  if (signedIn === null) return null;

  if (!signedIn) {
    return (
      <p className="rounded-xl bg-subcanvas px-3 py-2 text-body-sm text-ink-soft">
        <Link href="/login?next=/deck-simulator" className="font-bold text-primary-strong">
          로그인
        </Link>
        하면 덱을 저장할 수 있어요.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line/70 bg-subcanvas/40 p-2.5">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onSave}
          disabled={pending || empty}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-label-md font-bold text-white transition hover:bg-primary-container disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className="h-4 w-4" />}
          덱 저장
        </button>
        <button
          type="button"
          onClick={toggleList}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-label-md font-bold transition",
            open
              ? "border-primary bg-primary/10 text-primary-strong"
              : "border-line text-ink-soft hover:text-ink",
          )}
        >
          <FolderOpen className="h-4 w-4" />내 덱
        </button>
      </div>

      {msg && (
        <p className="flex items-center gap-1 px-1 text-label-sm text-ink-soft">
          <Check className="h-3.5 w-3.5" /> {msg}
        </p>
      )}

      {open && (
        <ul className="flex flex-col divide-y divide-line/50 overflow-hidden rounded-lg border border-line/60 bg-card">
          {decks.length === 0 ? (
            <li className="px-3 py-4 text-center text-body-sm text-ink-soft">저장한 덱이 없어요.</li>
          ) : (
            decks.map((d) => (
              <li key={d.id} className="flex items-center gap-2 px-3 py-2">
                <button
                  type="button"
                  onClick={() => onLoad(d.code)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block truncate text-body-md font-medium text-ink">{d.name}</span>
                  {d.legend_name && (
                    <span className="block truncate text-label-sm text-ink-soft">{d.legend_name}</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    start(async () => {
                      await deleteSavedDeck(d.id);
                      refresh();
                    })
                  }
                  aria-label="삭제"
                  className="shrink-0 rounded p-1 text-ink-soft hover:text-coral"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
