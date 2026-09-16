/** 게시글 목록 썸네일(post-list.tsx)/RSS/오픈그래프 미리보기에서 공용으로 쓰는 본문 파싱 헬퍼. */

const IMG_RE =
  /!\[[^\]]*\]\(\s*(https?:\/\/[^\s)]+?)\s*\)|(https?:\/\/[^\s)]+\.(?:png|jpe?g|gif|webp|avif))(?:\?[^\s)]*)?/i;

/** 본문에서 대표 썸네일 후보(붙여넣은 이미지 URL) 하나. */
export function thumbOf(body: string): string | null {
  const m = body?.match(IMG_RE);
  return m ? m[1] || m[2] : null;
}

/** 마크다운 기호를 걷어낸 본문 요약(og:description, RSS description 등에 사용). */
export function excerptOf(body: string, max = 200): string {
  const plain = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/[#>*_`[\]()!-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > max ? plain.slice(0, max) + "…" : plain;
}
