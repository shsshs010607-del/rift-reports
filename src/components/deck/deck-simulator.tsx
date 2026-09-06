"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Download, Eraser, Layers, Sparkles, Upload } from "lucide-react";

import type { Card } from "@/lib/types/card";
import type { Deck } from "@/lib/types/deck";
import { encodeDeck, decodeDeck } from "@/lib/deck/deck-code";
import {
  addEntry,
  clearDeck,
  planAdd,
  renameDeck,
  resolveDeck,
  setChampion,
  setLegend,
  validateDeck,
  zoneCounts,
  totalCards,
} from "@/lib/deck/deck-model";
import { formatDecklist } from "@/lib/deck/deck-text";
import { CardPool, type PoolTab } from "@/components/deck/card-pool";
import { DeckList } from "@/components/deck/deck-list";
import { SampleHand } from "@/components/deck/sample-hand";
import { ImportDialog } from "@/components/deck/import-dialog";
import { cn } from "@/lib/utils";

const LS_KEY = "rr:deck-simulator:last";

/**
 * 레전드의 도메인에 맞춰 룬을 자동으로 채운다.
 * 2색 → 6+6, 1색 → 12. 기존 룬 엔트리는 먼저 비운다.
 */
function fillRunes(
  d: Deck,
  legend: Card | undefined,
  runesByDomain: Map<string, Card>,
): Deck {
  const withoutRunes = {
    ...d,
    entries: d.entries.filter((e) => !runeIds(runesByDomain).has(e.id)),
  };
  if (!legend) return withoutRunes;
  const doms = legend.domains;
  let out = withoutRunes;
  if (doms.length >= 2) {
    for (const dm of doms.slice(0, 2)) {
      const rc = runesByDomain.get(dm);
      if (rc) out = addEntry(out, rc.id, 6);
    }
  } else if (doms.length === 1) {
    const rc = runesByDomain.get(doms[0]);
    if (rc) out = addEntry(out, rc.id, 12);
  }
  return out;
}
const runeIds = (m: Map<string, Card>) => new Set([...m.values()].map((c) => c.id));

export function DeckSimulator({
  initialDeck,
  initialCards,
}: {
  initialDeck: Deck;
  initialCards: Card[];
}) {
  const router = useRouter();

  const [deck, setDeck] = useState<Deck>(initialDeck);
  // 새 덱이면 레전드 칸부터 시작 (가이드 흐름)
  const [poolTab, setPoolTab] = useState<PoolTab>(initialDeck.legendId ? "main" : "legend");
  const [rightTab, setRightTab] = useState<"deck" | "hand">("deck");
  const [copied, setCopied] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const cacheRef = useRef<Map<string, Card>>(new Map(initialCards.map((c) => [c.id, c])));
  const registerCards = useCallback((cards: Card[]) => {
    for (const c of cards) cacheRef.current.set(c.id, c);
  }, []);

  // 도메인별 기본 룬 카드 (레전드 선택 시 6+6 자동 채우기용)
  const runesByDomain = useRef<Map<string, Card>>(new Map());
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/cards?type=rune&limit=60");
        if (!res.ok) return;
        const data = (await res.json()) as { cards: Card[] };
        for (const c of data.cards) {
          if (c.domains.length === 1 && !runesByDomain.current.has(c.domains[0])) {
            runesByDomain.current.set(c.domains[0], c);
            cacheRef.current.set(c.id, c);
          }
        }
        // 이미 레전드가 있는데 룬이 비었으면 지금 채운다
        setDeck((d) => (d.legendId ? fillRunes(d, cacheRef.current.get(d.legendId), runesByDomain.current) : d));
      } catch {
        /* 무시 */
      }
    })();
  }, []);

  // 가이드 흐름: 사용자가 탭을 직접 누르면 자동 이동 중단
  const autoFlow = useRef(true);
  const advance = (to: PoolTab) => {
    if (autoFlow.current) setPoolTab(to);
  };
  const handleTabChange = useCallback((t: PoolTab) => {
    autoFlow.current = false;
    setPoolTab(t);
  }, []);

  // 최초: URL에 덱 없고 localStorage에 있으면 복원
  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    if (initialDeck.legendId || initialDeck.championId || initialDeck.entries.length > 0) return;
    try {
      const saved = localStorage.getItem(LS_KEY);
      const restored = saved && decodeDeck(saved);
      if (restored && (restored.legendId || restored.championId || restored.entries.length > 0))
        setDeck(restored);
    } catch {
      /* 무시 */
    }
  }, [initialDeck]);

  // 덱 변경 → URL + localStorage (디바운스)
  const code = useMemo(() => encodeDeck(deck), [deck]);
  useEffect(() => {
    const t = setTimeout(() => {
      router.replace(code ? `/deck-simulator?deck=${code}` : "/deck-simulator", { scroll: false });
      try {
        if (code) localStorage.setItem(LS_KEY, code);
        else localStorage.removeItem(LS_KEY);
      } catch {
        /* 무시 */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [code, router]);

  const rd = useMemo(() => resolveDeck(deck, cacheRef.current), [deck]);
  const counts = useMemo(() => zoneCounts(rd), [rd]);
  const issues = useMemo(() => validateDeck(rd), [rd]);
  const errorCount = issues.filter((i) => i.level === "error").length;
  const total = totalCards(rd);

  // 풀에서 카드 클릭 — 슬롯/존 배치 + 가이드 흐름(레전드→챔피언→메인덱까지만 자동 이동)
  const handlePick = useCallback(
    (card: Card) => {
      cacheRef.current.set(card.id, card);
      const plan = planAdd(deck, rd, card);
      switch (plan.kind) {
        case "legend":
          setDeck((d) => fillRunes(setLegend(d, plan.id), card, runesByDomain.current));
          advance("champion");
          break;
        case "champion":
          setDeck((d) => setChampion(d, plan.id));
          advance("main");
          break;
        case "entry":
          setDeck((d) => addEntry(d, plan.id, 1));
          break;
        default:
          break; // blocked
      }
    },
    [deck, rd],
  );

  const changeEntry = useCallback((id: string, delta: number) => {
    setDeck((d) => addEntry(d, id, delta));
  }, []);

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 무시 */
    }
  }

  async function exportText() {
    try {
      await navigator.clipboard.writeText(formatDecklist(rd));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 무시 */
    }
  }

  function applyImport(next: Deck) {
    // 가져온 덱의 카드는 ImportDialog 가 이미 캐시에 등록함
    setDeck(next);
    setImportOpen(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 헤더 */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-card p-3">
        <input
          value={deck.name}
          onChange={(e) => setDeck((d) => renameDeck(d, e.target.value))}
          aria-label="덱 이름"
          className="min-w-40 flex-1 rounded-xl border border-line bg-subcanvas/50 px-3 py-2 text-title-md font-bold text-ink focus:border-primary focus:outline-none"
        />
        <span className="text-body-sm text-ink-soft">
          총 {total}장{errorCount > 0 && <span className="ml-1.5 rounded-full bg-error/10 px-2 py-0.5 text-label-sm font-bold text-error">규칙 위반 {errorCount}</span>}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(340px,420px)]">
        {/* 좌: 카드 풀 */}
        <CardPool
          tab={poolTab}
          onTabChange={handleTabChange}
          rd={rd}
          deck={deck}
          onPick={handlePick}
          onResults={registerCards}
        />

        {/* 우: 덱 / 샘플 핸드 */}
        <div className="flex flex-col rounded-2xl border border-line bg-card">
          <div className="flex border-b border-line">
            <TabButton active={rightTab === "deck"} onClick={() => setRightTab("deck")}>
              <Layers className="h-4 w-4" /> 덱
            </TabButton>
            <TabButton active={rightTab === "hand"} onClick={() => setRightTab("hand")}>
              <Sparkles className="h-4 w-4" /> 샘플 핸드
            </TabButton>
          </div>

          {rightTab === "deck" ? (
            <div className="flex flex-col gap-3 p-3">
              <ZoneSummary counts={counts} />
              <DeckList
                rd={rd}
                issues={issues}
                onChangeEntry={changeEntry}
                onClearLegend={() => setDeck((d) => fillRunes(setLegend(d, null), undefined, runesByDomain.current))}
                onClearChampion={() => setDeck((d) => setChampion(d, null))}
                onFocusPool={handleTabChange}
              />
              <div className="mt-1 grid grid-cols-2 gap-1.5 border-t border-line pt-3 sm:grid-cols-4">
                <ActionButton onClick={() => setImportOpen(true)} icon={<Upload className="h-4 w-4" />}>
                  가져오기
                </ActionButton>
                <ActionButton onClick={exportText} icon={<Download className="h-4 w-4" />}>
                  내보내기
                </ActionButton>
                <ActionButton onClick={copyShareLink} icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}>
                  {copied ? "복사됨" : "공유"}
                </ActionButton>
                <ActionButton
                  onClick={() => setDeck((d) => clearDeck(d))}
                  icon={<Eraser className="h-4 w-4" />}
                  danger
                >
                  비우기
                </ActionButton>
              </div>
            </div>
          ) : (
            <div className="p-3">
              <SampleHand mainEntries={rd.sections.main} deckName={deck.name} />
            </div>
          )}
        </div>
      </div>

      {importOpen && (
        <ImportDialog
          current={deck}
          onCache={registerCards}
          onApply={applyImport}
          onClose={() => setImportOpen(false)}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-label-lg font-bold transition",
        active
          ? "border-b-2 border-primary text-primary-strong"
          : "text-ink-soft hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function ZoneSummary({ counts }: { counts: ReturnType<typeof zoneCounts> }) {
  const items: { key: string; label: string; n: number; target: string; ok: boolean }[] = [
    { key: "legend", label: "레전드", n: counts.legend, target: "1", ok: counts.legend === 1 },
    { key: "champion", label: "챔피언", n: counts.champion, target: "1", ok: counts.champion === 1 },
    { key: "battlefield", label: "전장", n: counts.battlefield, target: "3", ok: counts.battlefield === 3 },
    { key: "rune", label: "룬", n: counts.rune, target: "12", ok: counts.rune === 12 },
    { key: "main", label: "메인덱", n: counts.main, target: "39~59", ok: counts.main >= 39 && counts.main <= 59 },
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it) => (
        <span
          key={it.key}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-label-sm",
            it.ok ? "border-emerald/40 bg-emerald/10 text-emerald" : "border-line text-ink-soft",
          )}
        >
          {it.label} <span className="font-bold">{it.n}/{it.target}</span>
        </span>
      ))}
    </div>
  );
}

function ActionButton({
  onClick,
  icon,
  children,
  danger,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg border border-line py-2 text-label-md font-semibold transition",
        danger ? "text-ink-soft hover:border-error/40 hover:text-error" : "text-ink-soft hover:border-primary/40 hover:text-ink",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
