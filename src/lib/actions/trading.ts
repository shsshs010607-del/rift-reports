"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  TRADING_CATEGORIES,
  TRADE_CONDITIONS,
  TRADE_STATUS,
  KR_SIDO,
} from "@/lib/constants";
import type { TradingCategory, TradeStatus } from "@/lib/types/database";

const categorySlugs = TRADING_CATEGORIES.map((c) => c.slug) as [string, ...string[]];
const conditionSlugs = TRADE_CONDITIONS.map((c) => c.slug) as [string, ...string[]];
const statusSlugs = TRADE_STATUS.map((s) => s.slug) as [string, ...string[]];
const sido = KR_SIDO as unknown as [string, ...string[]];

export type TradeActionState = { error?: string; fieldErrors?: Record<string, string> };

const listingSchema = z.object({
  category: z.enum(categorySlugs),
  title: z.string().trim().min(2, "제목은 2자 이상").max(120, "제목은 120자 이하"),
  description: z.string().trim().max(4000).optional(),
  card_condition: z.enum(conditionSlugs).optional(),
  price: z
    .union([z.coerce.number().int().min(0).max(100_000_000), z.literal(null)])
    .optional(),
  is_negotiable: z.boolean().optional(),
  region: z.enum(sido).optional(),
});

async function requireUser() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/trading/new");
  return { supabase, userId: data.user.id };
}

export async function createListing(
  _prev: TradeActionState,
  formData: FormData,
): Promise<TradeActionState> {
  const { supabase, userId } = await requireUser();

  const rawPrice = formData.get("price");
  const parsed = listingSchema.safeParse({
    category: formData.get("category"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    card_condition: formData.get("card_condition") || undefined,
    price: rawPrice === null || rawPrice === "" ? null : rawPrice,
    is_negotiable: formData.get("is_negotiable") === "on",
    region: formData.get("region") || undefined,
  });
  if (!parsed.success) {
    const f: Record<string, string> = {};
    for (const issue of parsed.error.issues) f[String(issue.path[0])] = issue.message;
    return { error: "입력을 확인하세요", fieldErrors: f };
  }
  const d = parsed.data;

  const { data, error } = await supabase
    .from("trade_listings")
    .insert({
      category: d.category as TradingCategory,
      title: d.title,
      description: d.description ?? null,
      card_id: null,
      card_condition: d.card_condition ?? null,
      price: d.price ?? null,
      is_negotiable: d.is_negotiable ?? false,
      region: d.region ?? null,
      seller_id: userId,
      images: [],
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "등록에 실패했습니다" };

  revalidatePath("/trading");
  redirect(`/trading/${data.id}`);
}

export async function setListingStatus(id: string, status: string) {
  const { supabase } = await requireUser();
  if (!statusSlugs.includes(status)) return;
  const { error } = await supabase
    .from("trade_listings")
    .update({ status: status as TradeStatus })
    .eq("id", id); // RLS: 본인만
  if (!error) {
    revalidatePath(`/trading/${id}`);
    revalidatePath("/trading");
  }
}

export async function deleteListing(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("trade_listings").delete().eq("id", id); // RLS: 본인만
  if (error) return;
  revalidatePath("/trading");
  redirect("/trading");
}
