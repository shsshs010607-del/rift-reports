import Link from "next/link";

import { glossaryByBracket } from "@/content/glossary";

/**
 * 카드 효과 텍스트 렌더러.
 * `[대괄호]` 용어 중 용어집에 있는 건 룰 페이지 앵커로 링크한다.
 */
export function CardText({ text, className }: { text: string; className?: string }) {
  if (!text) return null;
  const parts = text.split(/(\[[^\]]+\])/g);
  return (
    <p className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("[") && part.endsWith("]")) {
          const term = glossaryByBracket(part);
          if (term) {
            return (
              <Link
                key={i}
                href={`/glossary#term-${term.en}`}
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
