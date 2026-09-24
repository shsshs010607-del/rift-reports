"use client";

import { useState } from "react";
import { fmtKstRelative } from "@/lib/datetime";
import { deleteComment } from "@/lib/actions/community";
import type { CommentItem } from "@/lib/community";
import { cn } from "@/lib/utils";
import { Avatar } from "./avatar";

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
  const mine = currentUserId === c.author_id;

  return (
    <div className={cn("py-3.5", isReply && "ml-5 border-l-2 border-line/70 pl-4")}>
      <div className="flex items-center gap-2 text-body-sm">
        <Avatar name={c.author?.username} src={c.author?.avatar_url} size="sm" />
        <span className="font-bold text-ink">{c.author?.username ?? "알 수 없음"}</span>
        <time className="text-ink-soft">{fmtKstRelative(c.created_at)}</time>
      </div>
      <p className="mt-1.5 whitespace-pre-wrap text-body-md leading-relaxed text-ink">
        {linkify(c.body)}
      </p>
      {(mine || canModerate) && (
        <div className="mt-1.5 flex items-center gap-3">
          <DeleteBtn commentId={c.id} postId={postId} />
        </div>
      )}
    </div>
  );
}

/** 댓글 목록만 읽기 전용으로 보여준다 — 새 댓글·답글·수정은 게시판 개편으로 종료, 기존 댓글은 유지. */
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

  if (comments.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-3 text-title-md font-bold text-ink">
        댓글 <span className="text-primary-strong">{comments.length}</span>
      </h2>

      <div className="mt-2 divide-y divide-line/50">
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
