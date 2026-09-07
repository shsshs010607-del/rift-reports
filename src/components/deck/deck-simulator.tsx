"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Download, Eraser, Layers, Sparkles, Upload } from "lucide-react";

import type { Card } from "@/lib/types/card";
import type { Deck } from "@/lib/types/deck";
import {
  encodeDeck,
  decodeDeck,
  buildDeckRefMaps,
  encodeDeckCode,
  isDeckCode,
} from "@/lib/deck/deck-code";
import { SaveDeckControls } from "@/components/deck/save-deck-controls";
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
import { CardPool, type PoolTab } from "@/components/deck/card-pool";
import { DeckList } from "@/components/deck/deck-list";
import { DeckSteps } from "@/components/deck/deck-steps";
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
  const [restoredNote, setRestoredNote] = useState<number | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const flashMsg = useCallback((m: string) => {
    setFlash(m);
    setTimeout(() => setFlash(null), 2200);
  }, []);

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
        // 이미 레전드가 있고 그 카드가 캐시에 있으면 룬을 (재)정렬한다.
        // 레전드 카드를 아직 모르면 기존 룬을 건드리지 않는다 (복원된 덱 훼손 방지).
        setDeck((d) => {
          if (!d.legendId) return d;
          const legendCard = cacheRef.current.get(d.legendId);
          if (!legendCard || runesByDomain.current.size === 0) return d;
          return fillRunes(d, legendCard, runesByDomain.current);
        });
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
      if (restored && (restored.legendId || restored.championId || restored.entries.length > 0)) {
        const n =
          restored.entries.reduce((s, e) => s + e.qty, 0) +
          (restored.legendId ? 1 : 0) +
          (restored.championId ? 1 : 0);
        const ids = [
          restored.legendId,
          restored.championId,
          ...restored.entries.map((e) => e.id),
        ].filter((x): x is string => Boolean(x));
        // 복원 덱의 카드를 먼저 캐시에 채운 뒤 적용해야 즉시 제대로 보인다.
        fetch("/api/cards?limit=500")
          .then((r) => (r.ok ? r.json() : { cards: [] }))
          .then((d: { cards: Card[] }) => {
            const wanted = new Set(ids);
            for (const c of d.cards ?? []) if (wanted.has(c.id)) cacheRef.current.set(c.id, c);
          })
          .catch(() => {})
          .finally(() => {
            setDeck(restored);
            setRestoredNote(n);
          });
      }
    } catch {
      /* 무시 */
    }
  }, [initialDeck]);

  // 덱 변경 → URL(짧은 코드) + localStorage(base64, 자체완결)
  const lsCode = useMemo(() => encodeDeck(deck), [deck]);
  const shareCode = useMemo(() => {
    const { refById } = buildDeckRefMaps([...cacheRef.current.values()]);
    return encodeDeckCode(deck, refById) ?? lsCode;
  }, [deck, lsCode]);
  useEffect(() => {
    const t = setTimeout(() => {
      const url = shareCode
        ? `/deck-simulator?${isDeckCode(shareCode) ? "d" : "deck"}=${shareCode}`
        : "/deck-simulator";
      router.replace(url, { scroll: false });
      try {
        if (lsCode) localStorage.setItem(LS_KEY, lsCode);
        else localStorage.removeItem(LS_KEY);
      } catch {
        /* 무시 */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [shareCode, lsCode, router]);

  const rd = useMemo(() => resolveDeck(deck, cacheRef.current), [deck]);
  const counts = useMemo(() => zoneCounts(rd), [rd]);
  const issues = useMemo(() => validateDeck(rd), [rd]);
  const errorCount = issues.filter((i) => i.level === "error").length;
  const total = totalCards(rd);
  const isComplete =
    errorCount === 0 &&
    counts.legend === 1 &&
    counts.champion === 1 &&
    counts.battlefield === 3 &&
    counts.rune === 12 &&
    counts.main >= 39 &&
    counts.main <= 59;

  // 풀에서 카드 클릭 — 슬롯/존 배치 + 가이드 흐름(레전드→챔피언→메인덱까지만 자동 이동)
  const handlePick = useCallback(
    (card: Card) => {
      cacheRef.current.set(card.id, card);
      const plan = planAdd(deck, rd, card);
      switch (plan.kind) {
        case "legend":
          setDeck((d) => fillRunes(setLegend(d, plan.id), card, runesByDomain.current));
          flashMsg(`${card.name} 선택 · 룬 12장 자동 완성 → 다음: 챔피언`);
          advance("champion");
          break;
        case "champion":
          setDeck((d) => setChampion(d, plan.id));
          flashMsg("리더 챔피언 완료 → 다음: 메인덱 39장");
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

  async function exportCode() {
    if (!shareCode) return;
    try {
      await navigator.clipboard.writeText(shareCode);
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
    <div className="flex flex-col gap-3">
      {/* 헤더 */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-card p-3">
        <input
          value={deck.name}
          onChange={(e) => setDeck((d) => renameDeck(d, e.target.value))}
          aria-label="덱 이름"
          className="min-w-40 flex-1 rounded-xl border border-line bg-subcanvas/50 px-3 py-2 text-title-md font-bold text-ink focus:border-primary focus:outline-none"
        />
        <span className="flex items-center gap-1.5 text-body-sm text-ink-soft">
          총 {total}장
          {isComplete ? (
            <span className="rounded-full bg-emerald/15 px-2 py-0.5 text-label-sm font-bold text-emerald">
              완성
            </span>
          ) : errorCount > 0 ? (
            <span className="rounded-full bg-error/10 px-2 py-0.5 text-label-sm font-bold text-error">
              규칙 위반 {errorCount}
            </span>
          ) : null}
        </span>
      </div>

      {restoredNote !== null && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-body-sm text-ink">
          <span>
            이전에 편집하던 덱을 불러왔어요 (<b>{restoredNote}장</b>).
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setRestoredNote(null)}
              className="rounded-full border border-line px-2.5 py-1 text-label-sm font-bold text-ink-soft hover:text-ink"
            >
              계속 편집
            </button>
            <button
              type="button"
              onClick={() => {
                setDeck((d) => clearDeck(d));
                autoFlow.current = true;
                setPoolTab("legend");
                setRestoredNote(null);
              }}
              className="rounded-full bg-primary px-2.5 py-1 text-label-sm font-bold text-white"
            >
              비우고 새로 시작
            </button>
          </div>
        </div>
      )}

      {/* 덱 작성 가이드 */}
      <DeckSteps counts={counts} activeTab={poolTab} valid={isComplete} onGoto={handleTabChange} />

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
              <DeckList
                rd={rd}
                issues={issues}
                onChangeEntry={changeEntry}
                onClearLegend={() => setDeck((d) => fillRunes(setLegend(d, null), undefined, runesByDomain.current))}
                onClearChampion={() => setDeck((d) => setChampion(d, null))}
                onFocusPool={handleTabChange}
              />

              <SaveDeckControls
                deckName={deck.name}
                code={isDeckCode(shareCode) ? shareCode : null}
                legendName={rd.legend?.name ?? null}
                empty={total === 0}
                onLoad={(loadCode) => router.push(`/deck-simulator?d=${loadCode}`)}
              />

              <div className="mt-1 grid grid-cols-2 gap-1.5 border-t border-line pt-3 sm:grid-cols-4">
                <ActionButton onClick={() => setImportOpen(true)} icon={<Upload className="h-4 w-4" />}>
                  가져오기
                </ActionButton>
                <ActionButton onClick={exportCode} icon={<Download className="h-4 w-4" />}>
                  덱 코드
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

      {flash && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <p className="rounded-full bg-ink/90 px-4 py-2 text-label-md font-bold text-white shadow-lg">
            {flash}
          </p>
        </div>
      )}

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
