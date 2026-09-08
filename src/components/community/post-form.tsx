"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  Bold,
  Heading,
  Quote,
  List,
  Link2,
  Code,
  Layers,
  ImagePlus,
  Eye,
  Pencil,
  Check,
} from "lucide-react";
import { createPost, type ActionState } from "@/lib/actions/community";
import { COMMUNITY_CATEGORIES } from "@/lib/constants";
import { PostBody } from "@/components/community/post-body";
import { cn } from "@/lib/utils";

const initial: ActionState = {};

const INPUT =
  "w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-body-md text-ink placeholder:text-ink-soft/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

const DRAFT_KEY = "rr:community:draft:v1";
const BODY_MIN = 10;
const BODY_MAX = 20000;

type Draft = { category: string; title: string; body: string; deckCode: string; ts: number };

function SubmitBtn({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="rounded-full bg-primary px-7 py-2.5 text-label-md font-bold text-white transition hover:bg-primary-container disabled:opacity-50"
    >
      {pending ? "등록 중…" : "등록"}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-label-md font-bold text-ink">{children}</label>;
}

const PLACEHOLDERS: Record<string, string> = {
  "deck-guide":
    "덱 소개\n\n## 이런 분께 추천\n- \n\n## 운영법\n\n## 주요 매치업\n",
  report: "## 요약\n\n## 본문\n\n출처: ",
  recruit: "## 모집\n- 인원: \n- 방식: \n- 연락: \n",
};

export function PostForm({
  defaultCategory,
  canWriteNotice,
}: {
  defaultCategory?: string;
  canWriteNotice: boolean;
}) {
  const [state, formAction] = useFormState(createPost, initial);
  const [category, setCategory] = useState(defaultCategory ?? COMMUNITY_CATEGORIES[0].slug);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [deckCode, setDeckCode] = useState("");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const [restored, setRestored] = useState(false);

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const submittedRef = useRef(false);
  const hydratedRef = useRef(false);

  // ── 임시 저장 복구 ──────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as Draft;
      if ((d.title?.trim() || d.body?.trim()) && Date.now() - d.ts < 1000 * 60 * 60 * 24 * 14) {
        setCategory(defaultCategory ?? d.category ?? COMMUNITY_CATEGORIES[0].slug);
        setTitle(d.title ?? "");
        setBody(d.body ?? "");
        setDeckCode(d.deckCode ?? "");
        setRestored(true);
      }
    } catch {
      /* noop */
    }
    hydratedRef.current = true;
  }, [defaultCategory]);

  // ── 임시 저장 (디바운스) ────────────────────────────────
  useEffect(() => {
    if (!hydratedRef.current || submittedRef.current) return;
    if (!title.trim() && !body.trim()) return;
    setSaved("saving");
    const t = setTimeout(() => {
      try {
        const d: Draft = { category, title, body, deckCode, ts: Date.now() };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
        setSaved("saved");
      } catch {
        setSaved("idle");
      }
    }, 600);
    return () => clearTimeout(t);
  }, [category, title, body, deckCode]);

  // 서버가 에러를 돌려줬으면(리다이렉트 실패) 다시 저장 재개
  useEffect(() => {
    if (state?.error) submittedRef.current = false;
  }, [state]);

  const clearDraft = () => {
    submittedRef.current = true;
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* noop */
    }
  };

  const discardDraft = () => {
    setTitle("");
    setBody("");
    setDeckCode("");
    setRestored(false);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* noop */
    }
  };

  // ── 서식 삽입 ───────────────────────────────────────────
  const applyWrap = useCallback((before: string, after = before, placeholder = "") => {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const sel = value.slice(s, e) || placeholder;
    const next = value.slice(0, s) + before + sel + after + value.slice(e);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = s + before.length;
      el.selectionEnd = s + before.length + sel.length;
    });
  }, []);

  const applyLinePrefix = useCallback((prefix: string) => {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: s, value } = el;
    const lineStart = value.lastIndexOf("\n", s - 1) + 1;
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = s + prefix.length;
    });
  }, []);

  const insertBlock = useCallback((block: string) => {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const pre = s > 0 && value[s - 1] !== "\n" ? "\n" : "";
    const next = value.slice(0, s) + pre + block + value.slice(e);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = s + pre.length + block.length;
    });
  }, []);

  const onBodyKeyDown = (ev: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "b") {
      ev.preventDefault();
      applyWrap("**", "**", "굵게");
    }
  };

  const bodyLen = body.trim().length;
  const tooShort = bodyLen > 0 && bodyLen < BODY_MIN;

  const TOOLS: { icon: typeof Bold; label: string; run: () => void }[] = [
    { icon: Bold, label: "굵게", run: () => applyWrap("**", "**", "굵게") },
    { icon: Heading, label: "제목", run: () => applyLinePrefix("## ") },
    { icon: Quote, label: "인용", run: () => applyLinePrefix("> ") },
    { icon: List, label: "목록", run: () => applyLinePrefix("- ") },
    { icon: Link2, label: "링크", run: () => applyWrap("[", "](https://)", "링크 텍스트") },
    { icon: ImagePlus, label: "카드 이미지", run: () => applyWrap("[[", "]]", "카드명") },
    { icon: Code, label: "코드", run: () => insertBlock("```\n\n```\n") },
    { icon: Layers, label: "덱 코드", run: () => insertBlock("```deck\n\n```\n") },
  ];

  return (
    <form
      action={formAction}
      onSubmit={clearDraft}
      className="flex flex-col gap-4"
    >
      {restored && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/[0.06] px-3.5 py-2.5 text-body-sm text-ink">
          <span>작성하던 임시 글을 불러왔어요.</span>
          <button
            type="button"
            onClick={discardDraft}
            className="shrink-0 font-bold text-ink-soft hover:text-error"
          >
            새로 쓰기
          </button>
        </div>
      )}

      <div>
        <Label>게시판</Label>
        <select
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={INPUT}
        >
          {COMMUNITY_CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {category === "deck-guide" && (
        <div>
          <Label>덱 코드 (선택)</Label>
          <input
            name="deck_code"
            value={deckCode}
            onChange={(e) => setDeckCode(e.target.value)}
            placeholder="rr1.… 또는 덱 시뮬레이터 공유 코드 붙여넣기"
            className={INPUT}
            autoComplete="off"
          />
          <p className="mt-1 text-body-sm text-ink-soft">
            입력하면 글 상단에 덱 카드가 자동으로 표시됩니다. 덱 시뮬레이터 → 덱 코드 버튼으로 복사하세요.
          </p>
        </div>
      )}

      <div>
        <Label>제목</Label>
        <input
          name="title"
          required
          minLength={2}
          maxLength={150}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          className={INPUT}
        />
        {state.fieldErrors?.title && (
          <p className="mt-1 text-body-sm text-coral">{state.fieldErrors.title}</p>
        )}
      </div>

      <div>
        <div className="mb-1.5 flex items-end justify-between">
          <Label>내용</Label>
          <div className="flex items-center gap-1 rounded-lg bg-subcanvas p-0.5 text-label-sm font-bold">
            <button
              type="button"
              onClick={() => setTab("write")}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2.5 py-1 transition",
                tab === "write" ? "bg-card text-ink shadow-sm" : "text-ink-soft hover:text-ink",
              )}
            >
              <Pencil className="h-3.5 w-3.5" /> 작성
            </button>
            <button
              type="button"
              onClick={() => setTab("preview")}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2.5 py-1 transition",
                tab === "preview" ? "bg-card text-ink shadow-sm" : "text-ink-soft hover:text-ink",
              )}
            >
              <Eye className="h-3.5 w-3.5" /> 미리보기
            </button>
          </div>
        </div>

        {/* 서식 툴바 */}
        <div
          className={cn(
            "flex flex-wrap items-center gap-0.5 rounded-t-xl border border-b-0 border-line bg-subcanvas/60 px-1.5 py-1",
            tab === "preview" && "opacity-40",
          )}
        >
          {TOOLS.map((t) => (
            <button
              key={t.label}
              type="button"
              title={t.label}
              disabled={tab === "preview"}
              onClick={t.run}
              className="grid h-8 w-8 place-items-center rounded-md text-ink-soft transition hover:bg-card hover:text-ink disabled:pointer-events-none"
            >
              <t.icon className="h-4 w-4" />
            </button>
          ))}
          <span className="ml-auto pr-1 text-[11px] text-ink-soft/70">
            {saved === "saving" && "저장 중…"}
            {saved === "saved" && (
              <span className="inline-flex items-center gap-0.5">
                <Check className="h-3 w-3" /> 임시 저장됨
              </span>
            )}
          </span>
        </div>

        {tab === "write" ? (
          <textarea
            ref={bodyRef}
            name="body"
            required
            rows={16}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={onBodyKeyDown}
            placeholder={
              PLACEHOLDERS[category] ??
              "내용을 입력하세요.\n\n**굵게**, ## 제목, > 인용, - 목록, [링크](url) 를 쓸 수 있어요."
            }
            className="w-full resize-y rounded-b-xl border border-line bg-card px-3.5 py-3 font-mono text-[13.5px] leading-relaxed text-ink placeholder:text-ink-soft/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
        ) : (
          <div className="min-h-[16rem] rounded-b-xl border border-line bg-card px-4 py-3">
            {body.trim() ? (
              <PostBody text={body} />
            ) : (
              <p className="text-body-sm text-ink-soft">작성한 내용이 없습니다.</p>
            )}
            <textarea name="body" value={body} readOnly hidden />
          </div>
        )}

        <div className="mt-1 flex items-center justify-between text-body-sm">
          <span className={cn("text-ink-soft", tooShort && "text-coral")}>
            {tooShort
              ? `${BODY_MIN}자 이상 권장`
              : "서식: **굵게** · ## 제목 · - 목록 · [[카드명]] 카드 이미지 · ```deck 덱코드"}
          </span>
          <span className={cn("tabular-nums text-ink-soft/70", bodyLen > BODY_MAX && "text-coral")}>
            {bodyLen.toLocaleString()} / {BODY_MAX.toLocaleString()}
          </span>
        </div>
        {state.fieldErrors?.body && (
          <p className="mt-1 text-body-sm text-coral">{state.fieldErrors.body}</p>
        )}
      </div>

      {canWriteNotice && (
        <label className="inline-flex items-center gap-2 text-body-md text-ink">
          <input type="checkbox" name="is_notice" className="h-4 w-4 rounded border border-line" />
          공지로 등록 (관리자)
        </label>
      )}

      {state.error && !state.fieldErrors && (
        <p className="text-body-sm text-coral">{state.error}</p>
      )}

      <div className="flex items-center justify-end gap-2">
        <SubmitBtn disabled={bodyLen > BODY_MAX} />
      </div>
    </form>
  );
}
