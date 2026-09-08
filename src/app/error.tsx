"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, Home } from "lucide-react";

/** 예상치 못한 서버/클라이언트 오류 경계. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto grid max-w-md place-items-center py-24 text-center">
      <p className="font-display text-headline-lg text-ink">문제가 발생했어요</p>
      <p className="mt-2 text-body-md text-ink-soft">
        일시적인 오류일 수 있어요. 잠시 후 다시 시도해 주세요.
      </p>
      {error.digest && (
        <p className="mt-1 font-mono text-label-sm text-ink-soft/60">오류 코드: {error.digest}</p>
      )}
      <div className="mt-6 flex gap-2">
        <button type="button" onClick={reset} className="btn-primary">
          <RotateCcw className="h-4 w-4" />
          다시 시도
        </button>
        <Link href="/" className="btn-ghost">
          <Home className="h-4 w-4" />
          홈으로
        </Link>
      </div>
    </div>
  );
}
