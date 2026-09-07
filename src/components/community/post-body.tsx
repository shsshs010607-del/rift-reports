import { Fragment } from "react";
import { DeckShowcase } from "@/components/community/deck-showcase";

/**
 * 의존성 없는 마크다운-라이트 렌더러.
 * 지원: # ## ### 제목 · > 인용 · ``` 코드블록 · ```deck 덱 미리보기 · - / 1. 목록 · **굵게** · [텍스트](url) · 빈 줄 문단
 */
export function PostBody({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  const flushList = (items: string[], ordered: boolean) => {
    if (items.length === 0) return;
    const Tag = ordered ? "ol" : "ul";
    blocks.push(
      <Tag
        key={key++}
        className={`my-2 ${ordered ? "list-decimal" : "list-disc"} space-y-1 pl-5 text-body-md leading-relaxed text-ink-soft`}
      >
        {items.map((it, n) => (
          <li key={n}>{inline(it)}</li>
        ))}
      </Tag>,
    );
  };

  while (i < lines.length) {
    const line = lines[i];

    // 코드블록
    if (line.trimStart().startsWith("```")) {
      const lang = line.trimStart().slice(3).trim().toLowerCase();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        buf.push(lines[i]);
        i++;
      }
      i++; // closing fence
      if (lang === "deck" && buf.join("").trim()) {
        blocks.push(<DeckShowcase key={key++} code={buf.join("\n").trim()} />);
        continue;
      }
      blocks.push(
        <pre
          key={key++}
          className="my-3 overflow-x-auto rounded-xl border border-line/70 bg-subcanvas/60 p-3.5 text-[13px] leading-relaxed text-ink"
        >
          <code>{buf.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    // 제목
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      const lvl = h[1].length;
      const cls =
        lvl === 1
          ? "mt-6 mb-2 font-display text-title-lg font-bold text-ink"
          : lvl === 2
            ? "mt-5 mb-1.5 font-display text-title-md font-bold text-ink"
            : "mt-4 mb-1 text-body-lg font-bold text-ink";
      blocks.push(
        <p key={key++} className={cls}>
          {inline(h[2])}
        </p>,
      );
      i++;
      continue;
    }

    // 인용
    if (line.startsWith(">")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        buf.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push(
        <blockquote
          key={key++}
          className="my-3 border-l-4 border-primary/40 bg-primary/[0.04] px-3.5 py-2 text-body-md leading-relaxed text-ink-soft"
        >
          {buf.map((b, n) => (
            <p key={n}>{inline(b)}</p>
          ))}
        </blockquote>,
      );
      continue;
    }

    // 목록
    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ul || ol) {
      const ordered = Boolean(ol);
      const items: string[] = [];
      while (i < lines.length) {
        const m = ordered
          ? lines[i].match(/^\s*\d+\.\s+(.*)$/)
          : lines[i].match(/^\s*[-*]\s+(.*)$/);
        if (!m) break;
        items.push(m[1]);
        i++;
      }
      flushList(items, ordered);
      continue;
    }

    // 구분선
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
      blocks.push(<hr key={key++} className="my-5 border-line/60" />);
      i++;
      continue;
    }

    // 빈 줄
    if (line.trim() === "") {
      i++;
      continue;
    }

    // 문단 (연속 텍스트 줄 묶기)
    const buf: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,3}\s|>|\s*[-*]\s|\s*\d+\.\s|```)/.test(lines[i]) &&
      !/^\s*(-{3,}|\*{3,})\s*$/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key++} className="my-2 whitespace-pre-line text-body-md leading-relaxed text-ink">
        {inline(buf.join("\n"))}
      </p>,
    );
  }

  return <div className="text-ink">{blocks}</div>;
}

/** **굵게** 와 [텍스트](url) 인라인 처리 */
function inline(s: string): React.ReactNode {
  const parts = s.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const href = link[2];
      const external = /^https?:\/\//.test(href);
      return (
        <a
          key={i}
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="text-primary-strong underline"
        >
          {link[1]}
        </a>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
