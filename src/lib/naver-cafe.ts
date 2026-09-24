import { SITE } from "@/lib/constants";

/**
 * 네이버 카페 게시판 글 목록 (공개 게시판 한정, 로그인 불필요).
 * 카페 웹이 쓰는 비공식 JSON 엔드포인트라 형식이 바뀔 수 있음 → 실패하면 빈 목록.
 */
export interface CafeArticle {
  id: number;
  title: string;
  writer: string;
  commentCount: number;
  readCount: number;
  likeCount: number;
  /** ISO */
  writtenAt: string;
  thumb: string | null;
  url: string;
}

/** 카페 자유게시판 menuid */
export const CAFE_FREE_BOARD_MENU_ID = 7;

const LIST_API = "https://apis.naver.com/cafe-web/cafe2/ArticleListV2dot1.json";

export const cafeArticleUrl = (id: number) =>
  `https://cafe.naver.com/f-e/cafes/${SITE.naverCafeClubId}/articles/${id}`;

interface RawArticle {
  articleId: number;
  subject: string;
  writerNickname: string;
  commentCount: number;
  readCount: number;
  likeItCount: number;
  writeDateTimestamp: number;
  representImage?: string;
  blindArticle?: boolean;
  openArticle?: boolean;
}

export async function getCafeArticles({
  menuId = CAFE_FREE_BOARD_MENU_ID,
  page = 1,
  perPage = 20,
}: { menuId?: number; page?: number; perPage?: number } = {}): Promise<{
  articles: CafeArticle[];
  hasNext: boolean;
}> {
  const qs = new URLSearchParams({
    "search.clubid": SITE.naverCafeClubId,
    "search.menuid": String(menuId),
    "search.page": String(page),
    "search.perPage": String(perPage),
    "search.queryType": "lastArticle",
  });
  try {
    const res = await fetch(`${LIST_API}?${qs}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; riba.gg)" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return { articles: [], hasNext: false };
    const json = await res.json();
    const result = json?.message?.result;
    const list: RawArticle[] = Array.isArray(result?.articleList) ? result.articleList : [];
    return {
      hasNext: Boolean(result?.hasNext),
      articles: list
        .filter((a) => !a.blindArticle && a.openArticle !== false)
        .map((a) => ({
          id: a.articleId,
          title: a.subject,
          writer: a.writerNickname,
          commentCount: a.commentCount ?? 0,
          readCount: a.readCount ?? 0,
          likeCount: a.likeItCount ?? 0,
          writtenAt: new Date(a.writeDateTimestamp).toISOString(),
          thumb: a.representImage || null,
          url: cafeArticleUrl(a.articleId),
        })),
    };
  } catch {
    return { articles: [], hasNext: false };
  }
}
