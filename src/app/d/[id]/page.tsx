import { notFound, redirect } from "next/navigation";
import { getDeckShareCode } from "@/lib/deck/deck-share";

/** 덱 시뮬레이터 짧은 공유 링크: riba.gg/d/<id> → /deck-simulator?d=<code>. */
export default async function DeckSharePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const code = await getDeckShareCode(id);
  if (!code) notFound();
  redirect(`/deck-simulator?${code.startsWith("rr1.") ? "d" : "deck"}=${code}`);
}
