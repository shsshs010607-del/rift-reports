import { Eye, MessageSquare, ThumbsUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import type { Author } from "@/lib/community";

export function AuthorTag({ author }: { author: Author | null }) {
  return <span className="text-ink-soft">{author?.username ?? "알 수 없음"}</span>;
}

export function PostStats({
  views,
  comments,
  likes,
  createdAt,
}: {
  views: number;
  comments: number;
  likes: number;
  createdAt: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-ink-soft">
      <time dateTime={createdAt}>
        {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: ko })}
      </time>
      <span className="inline-flex items-center gap-1">
        <Eye className="h-3.5 w-3.5" />
        {views}
      </span>
      <span className="inline-flex items-center gap-1">
        <ThumbsUp className="h-3.5 w-3.5" />
        {likes}
      </span>
      <span className="inline-flex items-center gap-1">
        <MessageSquare className="h-3.5 w-3.5" />
        {comments}
      </span>
    </div>
  );
}
