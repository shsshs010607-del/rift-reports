"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleLike } from "@/lib/actions/community";

export function LikeButton({
  postId,
  initialCount,
  initialLiked,
  canLike,
}: {
  postId: string;
  initialCount: number;
  initialLiked: boolean;
  canLike: boolean;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, start] = useTransition();

  function onClick() {
    if (!canLike) {
      router.push("/login");
      return;
    }
    // 낙관적 업데이트
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));
    start(async () => {
      const res = await toggleLike(postId);
      if (res.error) {
        setLiked(liked);
        setCount(initialCount);
      } else {
        setLiked(res.liked);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={liked}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-6 py-2.5 text-label-md font-bold transition",
        liked
          ? "border-primary bg-primary text-white shadow-[0_4px_14px_rgba(70,72,212,0.25)]"
          : "border-line bg-card text-ink hover:border-primary/50 hover:text-primary-strong",
      )}
    >
      <ThumbsUp className={cn("h-4 w-4", liked && "fill-current")} />
      추천 {count}
    </button>
  );
}
