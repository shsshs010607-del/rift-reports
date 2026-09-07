"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createReport, createTournament, type AdminState } from "@/app/admin/actions";

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
