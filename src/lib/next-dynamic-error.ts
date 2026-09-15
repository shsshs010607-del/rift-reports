/**
 * Next.js는 `cookies()`/`headers()`/`searchParams` 사용을 감지하려고 정적 생성
 * 시도 중 특수한 제어-흐름 에러(digest: "DYNAMIC_SERVER_USAGE", 그리고 redirect()/
 * notFound() 의 "NEXT_REDIRECT"/"NEXT_NOT_FOUND")를 던진다. 이 프레임워크 신호를
 * 일반 try/catch 로 삼켜버리면 Next 가 "이 라우트는 동적이다"를 알아챌 방법이
 * 없어져서, `force-dynamic` 없이는 `next build` 가 정적 생성을 시도하다 타임아웃
 * 나거나 그대로 빌드가 실패한다 (실제로 여러 라우트에서 이 문제로 빌드가 깨졌음).
 *
 * 그래서 모든 "실패하면 폴백값 반환" 패턴은 이 함수를 catch 블록 맨 앞에서 불러
 * Next 의 신호는 무조건 다시 던지고, 진짜 에러(DB 오류·네트워크 실패 등)만 삼켜야 한다.
 */
export function rethrowIfNextControlFlow(e: unknown): void {
  const digest = (e as { digest?: unknown } | null | undefined)?.digest;
  if (
    typeof digest === "string" &&
    (digest === "DYNAMIC_SERVER_USAGE" ||
      digest.startsWith("NEXT_REDIRECT") ||
      digest === "NEXT_NOT_FOUND")
  ) {
    throw e;
  }
}
