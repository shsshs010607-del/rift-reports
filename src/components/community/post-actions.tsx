"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deletePost } from "@/lib/actions/community";

export function PostActions({ postId }: { postId: string }) {
  const [busy, setBusy] = useState(false);
  return (
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
  );
}
