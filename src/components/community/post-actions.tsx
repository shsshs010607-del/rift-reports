"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { deletePost } from "@/lib/actions/community";

export function PostActions({ postId, canEdit = true }: { postId: string; canEdit?: boolean }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="inline-flex items-center gap-1.5">
      {canEdit && (
        <Link
          href={`/community/post/${postId}/edit`}
          className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-body-sm text-ink-soft hover:border-primary hover:text-primary-strong"
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
        className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-body-sm text-ink-soft hover:border-coral hover:text-coral"
      >
        <Trash2 className="h-3.5 w-3.5" />
        삭제
      </button>
    </div>
  );
}
