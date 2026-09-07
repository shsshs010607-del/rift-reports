"use client";

import { useEffect, useRef } from "react";
import { incrementView } from "@/lib/actions/community";

/** 마운트 시 1회 조회수 증가. 세션 내 중복 방지. */
export function ViewCounter({
  postId,
  table = "posts",
}: {
  postId: string;
  table?: "posts" | "reports";
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const key = `viewed:${table}:${postId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* sessionStorage 불가 시 그냥 증가 */
    }
    void incrementView(postId, table);
  }, [postId, table]);

  return null;
}
