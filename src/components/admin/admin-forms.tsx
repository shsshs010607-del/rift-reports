"use client";

import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Trash2, Pencil, Check, X } from "lucide-react";
import {
  createReport,
  createTournament,
  createNotification,
  deleteNotification,
  deleteMetaDeck,
  updateMetaDeck,
  type AdminState,
} from "@/app/admin/actions";
import { createShop, type ShopState } from "@/lib/actions/shops";
import { KR_SIDO } from "@/lib/constants";

const KIND_KO: Record<string, string> = { notice: "공지", update: "업데이트", event: "이벤트" };

export function NotificationList({
  items,
}: {
  items: { id: string; title: string; kind: string; created_at: string }[];
}) {
  const [rows, setRows] = useState(items);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  if (rows.length === 0) {
    return <p className="text-body-sm text-ink-soft">발송한 알림이 없습니다.</p>;
  }

  const remove = (id: string) => {
    if (!confirm("이 알림을 삭제할까요? 모든 사용자에게서 사라집니다.")) return;
    start(async () => {
      const res = await deleteNotification(id);
      if (res.error) setMsg(res.error);
      else setRows((r) => r.filter((x) => x.id !== id));
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {msg && <p className="text-body-sm text-coral">{msg}</p>}
      <ul className="divide-y divide-line/50 overflow-hidden rounded-xl border border-line/70">
        {rows.map((n) => (
          <li key={n.id} className="flex items-center gap-3 px-3 py-2.5">
            <span className="shrink-0 rounded bg-subcanvas px-1.5 py-0.5 text-[11px] font-bold text-ink-soft">
              {KIND_KO[n.kind] ?? n.kind}
            </span>
            <span className="min-w-0 flex-1 truncate text-body-md text-ink">{n.title}</span>
            <span className="shrink-0 text-label-sm text-ink-soft">
              {new Date(n.created_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
            </span>
            <button
              type="button"
              onClick={() => remove(n.id)}
              disabled={pending}
              className="shrink-0 rounded-lg p-1.5 text-ink-soft transition hover:bg-error/10 hover:text-error disabled:opacity-40"
              aria-label="삭제"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MetaDeckList({
  items,
}: {
  items: {
    id: string;
    name: string;
    legend_name: string | null;
    is_tournament: boolean;
    source_url: string | null;
  }[];
}) {
  const [rows, setRows] = useState(items);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", legend_name: "", is_tournament: false });

  if (rows.length === 0) {
    return <p className="text-body-sm text-ink-soft">등록된 메타 덱이 없습니다.</p>;
  }

  const remove = (id: string, name: string) => {
    if (!confirm(`메타 덱 "${name}" 을(를) 삭제할까요?`)) return;
    start(async () => {
      const res = await deleteMetaDeck(id);
      if (res.error) setMsg(res.error);
      else {
        setMsg(null);
        setRows((r) => r.filter((x) => x.id !== id));
      }
    });
  };

  const beginEdit = (d: (typeof rows)[number]) => {
    setMsg(null);
    setEditId(d.id);
    setDraft({
      name: d.name,
      legend_name: d.legend_name ?? "",
      is_tournament: d.is_tournament,
    });
  };

  const save = (id: string) => {
    start(async () => {
      const res = await updateMetaDeck({ id, ...draft });
      if (res.error) setMsg(res.error);
      else {
        setMsg(null);
        setRows((r) =>
          r.map((x) =>
            x.id === id
              ? {
                  ...x,
                  name: draft.name.trim(),
                  legend_name: draft.legend_name.trim() || null,
                  is_tournament: draft.is_tournament,
                }
              : x,
          ),
        );
        setEditId(null);
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {msg && <p className="text-body-sm text-coral">{msg}</p>}
      <ul className="divide-y divide-line/50 overflow-hidden rounded-xl border border-line/70">
        {rows.map((d) =>
          editId === d.id ? (
            <li key={d.id} className="flex flex-col gap-2 px-3 py-3">
              <input
                value={draft.name}
                onChange={(e) => setDraft((s) => ({ ...s, name: e.target.value }))}
                placeholder="덱 이름"
                className="w-full rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-body-md text-ink focus:border-primary focus:outline-none"
              />
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={draft.legend_name}
                  onChange={(e) => setDraft((s) => ({ ...s, legend_name: e.target.value }))}
                  placeholder="레전드명 (예: Garen)"
                  className="min-w-[140px] flex-1 rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-body-sm text-ink focus:border-primary focus:outline-none"
                />
                <label className="flex items-center gap-1.5 text-body-sm text-ink-soft">
                  <input
                    type="checkbox"
                    checked={draft.is_tournament}
                    onChange={(e) => setDraft((s) => ({ ...s, is_tournament: e.target.checked }))}
                  />
                  대회 덱
                </label>
                <button
                  type="button"
                  onClick={() => save(d.id)}
                  disabled={pending || !draft.name.trim()}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-label-sm font-bold text-white transition hover:bg-primary-container disabled:opacity-40"
                >
                  <Check className="h-3.5 w-3.5" /> 저장
                </button>
                <button
                  type="button"
                  onClick={() => setEditId(null)}
                  disabled={pending}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-label-sm text-ink-soft transition hover:bg-subcanvas"
                >
                  <X className="h-3.5 w-3.5" /> 취소
                </button>
              </div>
            </li>
          ) : (
            <li key={d.id} className="flex items-center gap-3 px-3 py-2.5">
              {d.is_tournament && (
                <span className="shrink-0 rounded bg-subcanvas px-1.5 py-0.5 text-[11px] font-bold text-ink-soft">
                  대회
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-body-md text-ink">
                {d.name}
                {d.legend_name && (
                  <span className="ml-1.5 text-label-sm text-ink-soft">· {d.legend_name}</span>
                )}
              </span>
              {d.source_url && (
                <a
                  href={d.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-label-sm text-primary-strong hover:underline"
                >
                  원본
                </a>
              )}
              <button
                type="button"
                onClick={() => beginEdit(d)}
                disabled={pending}
                className="shrink-0 rounded-lg p-1.5 text-ink-soft transition hover:bg-subcanvas hover:text-ink disabled:opacity-40"
                aria-label="수정"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => remove(d.id, d.name)}
                disabled={pending}
                className="shrink-0 rounded-lg p-1.5 text-ink-soft transition hover:bg-error/10 hover:text-error disabled:opacity-40"
                aria-label="삭제"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

function Text({
  name,
  label,
  required,
  placeholder,
  type = "text",
}: {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-label-sm font-bold text-ink">
        {label}
        {required && <span className="text-coral"> *</span>}
      </span>
      <input name={name} type={type} required={required} placeholder={placeholder} className="field" />
    </label>
  );
}

function Area({
  name,
  label,
  rows = 6,
  required,
  placeholder,
}: {
  name: string;
  label: string;
  rows?: number;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-label-sm font-bold text-ink">
        {label}
        {required && <span className="text-coral"> *</span>}
      </span>
      <textarea name={name} rows={rows} required={required} placeholder={placeholder} className="field" />
    </label>
  );
}

function Msg({ state }: { state: AdminState }) {
  if (state.ok) return <p className="text-body-sm text-emerald">{state.ok}</p>;
  if (state.error) return <p className="text-body-sm text-coral">{state.error}</p>;
  return null;
}

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "저장 중…" : label}
    </button>
  );
}

export function ReportForm() {
  const [state, action] = useFormState<AdminState, FormData>(createReport, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <Text name="title" label="제목" required />
      <Text name="slug" label="슬러그 (비우면 제목에서 자동)" placeholder="meta-2026-09" />
      <Text name="tag" label="태그" placeholder="메타 분석 / 뉴스 / 카드 리뷰" />
      <Text name="cover_image_url" label="커버 이미지 URL" placeholder="https://…" />
      <Area name="excerpt" label="요약" rows={2} />
      <Area name="body" label="본문" rows={10} required placeholder="줄바꿈 그대로 표시됩니다." />
      <label className="flex flex-col gap-1">
        <span className="text-label-sm font-bold text-ink">상태</span>
        <select name="status" className="field" defaultValue="draft">
          <option value="draft">임시저장 (비공개)</option>
          <option value="published">발행</option>
        </select>
      </label>
      <Msg state={state} />
      <SubmitBtn label="리포트 저장" />
    </form>
  );
}

export function TournamentForm() {
  const [state, action] = useFormState<AdminState, FormData>(createTournament, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <Text name="name" label="대회명" required />
      <Text name="slug" label="슬러그 (비우면 자동)" />
      <label className="flex flex-col gap-1">
        <span className="text-label-sm font-bold text-ink">분류</span>
        <select name="category" className="field" defaultValue="community">
          <option value="official">공식 (라이엇 주최)</option>
          <option value="shop">매장 대회 (카드샵 이벤트)</option>
          <option value="community">커뮤니티 대회</option>
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <Text name="starts_at" label="시작 일시" type="datetime-local" required />
        <Text name="ends_at" label="종료 일시" type="datetime-local" />
      </div>
      <Text name="format" label="포맷" placeholder="스탠다드 · 스위스 5R + 컷" />
      <label className="flex items-center gap-2 text-body-md text-ink">
        <input type="checkbox" name="is_online" className="h-4 w-4" /> 온라인 진행
      </label>
      <Text name="location" label="장소" placeholder="서울 강남 OO카드샵" />
      <Text name="organizer" label="주최" />
      <Text name="prize_pool" label="상품" placeholder="1위 부스터 박스 외" />
      <Text name="registration_url" label="참가 신청 URL" placeholder="https://…" />
      <Text name="banner_url" label="배너 이미지 URL" placeholder="https://…" />
      <Area name="description" label="소개" rows={5} />
      <label className="flex flex-col gap-1">
        <span className="text-label-sm font-bold text-ink">상태</span>
        <select name="status" className="field" defaultValue="upcoming">
          <option value="upcoming">예정</option>
          <option value="ongoing">진행 중</option>
          <option value="finished">종료</option>
        </select>
      </label>
      <Msg state={state} />
      <SubmitBtn label="대회 저장" />
    </form>
  );
}

export function NotificationForm() {
  const [state, action] = useFormState<AdminState, FormData>(createNotification, {});
  return (
    <form action={action} className="flex flex-col gap-3" key={state.ok}>
      <Text name="title" label="제목" required placeholder="OGN 밸런스 패치 요약 공개" />
      <Area name="body" label="내용" rows={3} placeholder="여러 줄 입력 가능. 알림 패널에 그대로 표시됩니다." />
      <Text name="href" label="연결 링크 (사이트 내부 경로)" placeholder="/community/post/…  ·  /trading" />
      <label className="flex flex-col gap-1">
        <span className="text-label-sm font-bold text-ink">종류</span>
        <select name="kind" className="field" defaultValue="notice">
          <option value="notice">공지</option>
          <option value="update">업데이트</option>
          <option value="event">이벤트</option>
        </select>
      </label>
      <Msg state={state} />
      <SubmitBtn label="전체 발송" />
      <p className="text-body-sm text-ink-soft">
        모든 방문자의 알림 벨에 표시됩니다. 로그인 사용자는 안 읽음 배지가 뜹니다.
      </p>
    </form>
  );
}

export function ShopForm() {
  const [state, action] = useFormState<ShopState, FormData>(createShop, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <Text name="name" label="매장명" required />
      <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
        <label className="flex flex-col gap-1">
          <span className="text-label-sm font-bold text-ink">
            시/도 <span className="text-coral">*</span>
          </span>
          <select name="sido" className="field" required defaultValue="">
            <option value="" disabled>
              선택
            </option>
            {KR_SIDO.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <Text name="sigungu" label="시/군/구" placeholder="강남구" />
      </div>
      <Text name="address" label="주소" required placeholder="도로명 주소 (지도 핀은 이 주소로 자동)" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Text name="lat" label="위도 (선택)" placeholder="37.4979" />
        <Text name="lng" label="경도 (선택)" placeholder="127.0276" />
      </div>
      <Text name="phone" label="전화" placeholder="02-000-0000" />
      <Text name="hours" label="영업시간" placeholder="평일 13-22시 / 주말 12-23시" />
      <Text name="url" label="홈페이지 · SNS URL" placeholder="https://…" />
      <label className="flex items-center gap-2 text-body-md text-ink">
        <input type="checkbox" name="is_official" className="h-4 w-4" /> 리프트바운드 공인샵
      </label>
      <Area name="note" label="메모" rows={2} placeholder="주간 대회 요일 등" />
      <Msg state={state} />
      <SubmitBtn label="매장 저장" />
    </form>
  );
}
