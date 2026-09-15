"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { CornerDownRight, SendHorizontal } from "lucide-react";
import { fmtKstRelative } from "@/lib/datetime";
import {
  createComment,
  deleteComment,
  updateComment,
  type ActionState,
} from "@/lib/actions/community";
import type { CommentItem } from "@/lib/community";
import { cn } from "@/lib/utils";
import { Avatar } from "./avatar";

const initial: ActionState = {};

const URL_RE = /(https?:\/\/[^\s]+)/g;
const TRAILING_PUNCT_RE = /[),.!?;:'"\]]+$/;

/** 댓글 본문에서 http(s):// 로 시작하는 링크를 자동으로 하이퍼링크로 바꾼다. */
function linkify(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = URL_RE.exec(text))) {
    if (m.index > lastIndex) nodes.push(text.slice(lastIndex, m.index));
    let url = m[0];
    let trailing = "";
    const tm = url.match(TRAILING_PUNCT_RE);
    if (tm) {
      trailing = tm[0];
      url = url.slice(0, -trailing.length);
    }
    if (url) {
      nodes.push(
        <a
          key={key++}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-primary-strong underline"
        >
          {url}
        </a>,
      );
      if (trailing) nodes.push(trailing);
    } else {
      nodes.push(m[0]);
    }
    lastIndex = URL_RE.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

const INPUT =
  "w-full resize-y rounded-xl border border-line bg-card px-3.5 py-2.5 text-body-md text-ink placeholder:text-ink-soft/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 self-end rounded-lg bg-primary px-4 py-2 text-label-md font-bold text-white transition hover:bg-primary-container disabled:opacity-50"
    >
      {pending ? "등록 중…" : label}
    </button>
  );
}

/** 채팅형 입력창 안에 딸린 원형 전송 버튼. */
function SendBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={label}
      title={label}
      className="grid h-9 w-9 shrink-0 place-items-center self-end rounded-full bg-primary text-white transition hover:bg-primary-container disabled:opacity-50"
    >
      <SendHorizontal className="h-4 w-4" />
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
    <form action={formAction} className={cn("flex flex-col gap-1.5", compact ? "mt-2" : "mt-4")}>
      <input type="hidden" name="post_id" value={postId} />
      {parentId && <input type="hidden" name="parent_id" value={parentId} />}
      <div className="flex items-end gap-1.5 rounded-2xl border border-line bg-card p-1.5 pl-3.5 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
        <textarea
          name="body"
          required
          rows={compact ? 1 : 2}
          placeholder={parentId ? "답글 입력…" : "댓글을 입력하세요"}
          className="w-full resize-y border-0 bg-transparent py-1.5 text-body-md text-ink placeholder:text-ink-soft/70 focus:outline-none"
        />
        <SendBtn label={parentId ? "답글 등록" : "댓글 등록"} />
      </div>
      {state.error && <p className="text-body-sm text-coral">{state.error}</p>}
    </form>
  );
}

function CommentEditForm({
  commentId,
  postId,
  initialBody,
  onDone,
}: {
  commentId: string;
  postId: string;
  initialBody: string;
  onDone: () => void;
}) {
  const [state, formAction] = useFormState(
    async (p: ActionState, fd: FormData) => {
      const res = await updateComment(commentId, postId, p, fd);
      if (!res.error) onDone();
      return res;
    },
    initial,
  );

  return (
    <form action={formAction} className="mt-2 flex flex-col gap-2">
      <textarea
        name="body"
        required
        rows={3}
        defaultValue={initialBody}
        className={INPUT}
      />
      <div className="flex items-center gap-2">
        <SubmitBtn label="수정" />
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg px-3 py-2 text-label-md font-bold text-ink-soft hover:text-ink"
        >
          취소
        </button>
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
  const [editing, setEditing] = useState(false);
  const mine = currentUserId === c.author_id;

  return (
    <div className={cn("py-3.5", isReply && "ml-5 border-l-2 border-line/70 pl-4")}>
      <div className="flex items-center gap-2 text-body-sm">
        <Avatar name={c.author?.username} src={c.author?.avatar_url} size="sm" />
        <span className="font-bold text-ink">{c.author?.username ?? "알 수 없음"}</span>
        <time className="text-ink-soft">{fmtKstRelative(c.created_at)}</time>
      </div>
      {editing ? (
        <CommentEditForm
          commentId={c.id}
          postId={postId}
          initialBody={c.body}
          onDone={() => setEditing(false)}
        />
      ) : (
        <p className="mt-1.5 whitespace-pre-wrap text-body-md leading-relaxed text-ink">
          {linkify(c.body)}
        </p>
      )}
      <div className="mt-1.5 flex items-center gap-3">
        {!isReply && currentUserId && !editing && (
          <button
            type="button"
            onClick={() => setReplying((v) => !v)}
            className="inline-flex items-center gap-1 text-body-sm text-ink-soft hover:text-primary-strong"
          >
            <CornerDownRight className="h-3.5 w-3.5" />
            답글
          </button>
        )}
        {mine && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-body-sm text-ink-soft hover:text-primary-strong"
          >
            수정
          </button>
        )}
        {(mine || canModerate) && !editing && <DeleteBtn commentId={c.id} postId={postId} />}
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
