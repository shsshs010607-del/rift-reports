import Link from "next/link";

import { glossaryByBracket } from "@/content/glossary";

/** `[맹공 2]` → "맹공" (대괄호·후행 숫자 제거) — 카드 검색어로 쓴다. */
function bracketToQuery(bracket: string): string {
  return bracket
    .replace(/^\[|\]$/g, "")
    .replace(/\s*\d+\s*$/, "")
    .trim();
}

/**
 * 카드 효과 텍스트 렌더러.
 * `[대괄호]` 용어 중 용어집에 있는 건 링크한다.
 *  - linkTo="glossary" (기본): 용어집 설명으로
 *  - linkTo="cards": 그 용어가 등장하는 카드 목록으로 (/cards?q=…)
 */
export function CardText({
  text,
  className,
  linkTo = "glossary",
  onNavigate,
}: {
  text: string;
  className?: string;
  linkTo?: "glossary" | "cards";
  /** 링크 클릭 시 호출 (모달 닫기 등). */
  onNavigate?: () => void;
}) {
  if (!text) return null;
  const parts = text.split(/(\[[^\]]+\])/g);
  return (
    <p className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("[") && part.endsWith("]")) {
          const term = glossaryByBracket(part);
          if (term) {
            const href =
              linkTo === "cards"
                ? `/cards?q=${encodeURIComponent(bracketToQuery(part))}`
                : `/glossary#term-${term.en}`;
            return (
              <Link
                key={i}
                href={href}
                onClick={onNavigate}
                title={
                  linkTo === "cards"
                    ? `"${bracketToQuery(part)}" 효과를 가진 카드 보기`
                    : `용어 설명: ${term.term}`
                }
                className="font-bold text-primary-strong underline decoration-primary/30 underline-offset-2 hover:decoration-primary"
              >
                {part}
              </Link>
            );
          }
          return (
            <strong key={i} className="font-bold text-ink">
              {part}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}
