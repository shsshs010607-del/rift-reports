"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { CornerDownRight } from "lucide-react";
import { createComment, deleteComment, type ActionState } from "@/lib/actions/community";
import type { CommentItem } from "@/lib/community";
import { cn } from "@/lib/utils";
import { Avatar } from "./avatar";

const initial: ActionState = {};

const INPUT =
  "w-full resize-y rounded-xl border border-line bg-card px-3.5 py-2.5 text-body-md text-ink placeholder:text-ink-soft/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 self-end rounded-full bg-primary px-4 py-2 text-label-md font-bold text-white transition hover:bg-primary-container disabled:opacity-50"
    >
      {pending ? "등록 중…" : label}
    </button>
  );
}

function CommentForm({
  postId,
  parentId,
  onDone,
  compact,
}: {
  postId: string;
  parentId?: string;
  onDone?: () => void;
  compact?: boolean;
}) {
  const [state, formAction] = useFormState(async (p: ActionState, fd: FormData) => {
    const res = await createComment(p, fd);
    if (!res.error) onDone?.();
    return res;
  }, initial);

  return (
    <form action={formAction} className={cn("flex flex-col gap-2", compact ? "mt-2" : "mt-4")}>
      <input type="hidden" name="post_id" value={postId} />
      {parentId && <input type="hidden" name="parent_id" value={parentId} />}
      <div className="flex gap-2">
        <textarea
          name="body"
          required
          rows={compact ? 2 : 3}
          placeholder={parentId ? "답글 입력…" : "댓글을 입력하세요"}
          className={INPUT}
        />
        <SubmitBtn label={parentId ? "답글" : "등록"} />
      </div>
      {state.error && <p className="text-body-sm text-coral">{state.error}</p>}
    </form>
  );
}

function DeleteBtn({ commentId, postId }: { commentId: string; postId: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!confirm("댓글을 삭제할까요?")) return;
        setBusy(true);
        await deleteComment(commentId, postId);
        setBusy(false);
      }}
      className="text-body-sm text-ink-soft hover:text-coral"
    >
      삭제
    </button>
  );
}

function CommentNode({
  c,
  postId,
  currentUserId,
  canModerate,
  isReply,
}: {
  c: CommentItem;
  postId: string;
  currentUserId: string | null;
  canModerate: boolean;
  isReply?: boolean;
}) {
  const [replying, setReplying] = useState(false);
  const mine = currentUserId === c.author_id;

  return (
    <div className={cn("py-3.5", isReply && "ml-5 border-l-2 border-line/70 pl-4")}>
      <div className="flex items-center gap-2 text-body-sm">
        <Avatar name={c.author?.username} src={c.author?.avatar_url} size="sm" />
        <span className="font-bold text-ink">{c.author?.username ?? "알 수 없음"}</span>
        <time className="text-ink-soft">
          {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ko })}
        </time>
      </div>
      <p className="mt-1.5 whitespace-pre-wrap text-body-md leading-relaxed text-ink">{c.body}</p>
      <div className="mt-1.5 flex items-center gap-3">
        {!isReply && currentUserId && (
          <button
            type="button"
            onClick={() => setReplying((v) => !v)}
            className="inline-flex items-center gap-1 text-body-sm text-ink-soft hover:text-primary-strong"
          >
            <CornerDownRight className="h-3.5 w-3.5" />
            답글
          </button>
        )}
        {(mine || canModerate) && <DeleteBtn commentId={c.id} postId={postId} />}
      </div>
      {replying && (
        <CommentForm postId={postId} parentId={c.id} compact onDone={() => setReplying(false)} />
      )}
    </div>
  );
}

export function CommentSection({
  postId,
  comments,
  currentUserId,
  canModerate,
}: {
  postId: string;
  comments: CommentItem[];
  currentUserId: string | null;
  canModerate: boolean;
}) {
  const roots = comments.filter((c) => !c.parent_id);
  const childrenOf = (id: string) => comments.filter((c) => c.parent_id === id);

  return (
    <section className="mt-10">
      <h2 className="mb-3 text-title-md font-bold text-ink">
        댓글 <span className="text-primary-strong">{comments.length}</span>
      </h2>

      {currentUserId ? (
        <CommentForm postId={postId} />
      ) : (
        <p className="rounded-xl bg-subcanvas px-4 py-3 text-body-sm text-ink-soft">
          댓글을 쓰려면{" "}
          <a href="/login" className="font-bold text-primary-strong">
            로그인
          </a>
          하세요.
        </p>
      )}

      <div className="mt-2 divide-y divide-line/50">
        {roots.length === 0 && (
          <p className="py-8 text-center text-body-sm text-ink-soft">첫 댓글을 남겨보세요.</p>
        )}
        {roots.map((c) => (
          <div key={c.id}>
            <CommentNode
              c={c}
              postId={postId}
              currentUserId={currentUserId}
              canModerate={canModerate}
            />
            {childrenOf(c.id).map((child) => (
              <CommentNode
                key={child.id}
                c={child}
                postId={postId}
                currentUserId={currentUserId}
                canModerate={canModerate}
                isReply
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
