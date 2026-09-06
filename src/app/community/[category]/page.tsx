import { notFound } from "next/navigation";
import { PageHeading, ComingSoon } from "@/components/ui/page-heading";
import { COMMUNITY_CATEGORIES } from "@/lib/constants";

export default function CommunityCategoryPage({ params }: { params: { category: string } }) {
  const category = COMMUNITY_CATEGORIES.find((c) => c.slug === params.category);
  if (!category) notFound();

  return (
    <div>
      <PageHeading title={`커뮤니티 · ${category.label}`} />
      <ComingSoon note={`${category.label} 카테고리 게시글 목록. 쿼리: posts where category = '${params.category}'`} />
    </div>
  );
}
