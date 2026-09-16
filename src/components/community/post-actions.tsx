"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { deletePost, setNoticePriority } from "@/lib/actions/community";

export function PostActions({
  postId,
  canEdit = true,
  noticeOrder,
  noticePriority = 0,
}: {
  postId: string;
  canEdit?: boolean;
  /** true 면 공지 노출 순서 조절 컨트롤을 같이 보여준다 (스태프만 볼 수 있게 호출부에서 걸러줄 것). */
  noticeOrder?: boolean;
  noticePriority?: number;
}) {
  const [busy, setBusy] = useState(false);
  const [priority, setPriority] = useState(noticePriority);
  const [prBusy, setPrBusy] = useState(false);

  async function bump(delta: number) {
    setPrBusy(true);
    const next = priority + delta;
    const res = await setNoticePriority(postId, next);
    if (!res?.error) setPriority(next);
    setPrBusy(false);
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      {noticeOrder && (
        <span className="inline-flex items-center gap-0.5 rounded-lg border border-line px-1 py-0.5">
          <button
            type="button"
            disabled={prBusy}
            onClick={() => bump(1)}
            title="공지 상단으로 우선순위 올리기"
            className="grid h-6 w-6 place-items-center rounded text-ink-soft hover:bg-subcanvas hover:text-primary-strong disabled:opacity-40"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <span className="w-5 text-center text-label-sm font-bold tabular-nums text-ink-soft">
            {priority}
          </span>
          <button
            type="button"
            disabled={prBusy}
            onClick={() => bump(-1)}
            title="공지 우선순위 내리기"
            className="grid h-6 w-6 place-items-center rounded text-ink-soft hover:bg-subcanvas hover:text-primary-strong disabled:opacity-40"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </span>
      )}
      {canEdit && (
        <Link
          href={`/community/post/${postId}/edit`}
          className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1 text-body-sm text-ink-soft hover:border-primary hover:text-primary-strong"
        >
          <Pencil className="h-3.5 w-3.5" />
          수정
        </Link>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          if (!confirm("이 글을 삭제할까요? 되돌릴 수 없습니다.")) return;
          setBusy(true);
          await deletePost(postId);
        }}
        className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1 text-body-sm text-ink-soft hover:border-coral hover:text-coral"
      >
        <Trash2 className="h-3.5 w-3.5" />
        삭제
      </button>
    </div>
  );
}
