"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { KR_SIDO } from "@/lib/constants";

export type ShopState = { error?: string; ok?: string };

async function requireStaff() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "editor" && profile?.role !== "admin") redirect("/");
  return { supabase };
}

const shopSchema = z.object({
  name: z.string().trim().min(1).max(80),
  sido: z.enum(KR_SIDO as unknown as [string, ...string[]]),
  sigungu: z.string().trim().max(40).optional(),
  address: z.string().trim().min(2).max(200),
  lat: z.coerce.number().min(33).max(43).optional().or(z.literal("")),
  lng: z.coerce.number().min(124).max(132).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional(),
  hours: z.string().trim().max(120).optional(),
  url: z.string().trim().url().optional().or(z.literal("")),
  is_official: z.boolean().optional(),
  note: z.string().trim().max(500).optional(),
});

export async function createShop(_prev: ShopState, formData: FormData): Promise<ShopState> {
  const { supabase } = await requireStaff();
  const parsed = shopSchema.safeParse({
    name: formData.get("name"),
    sido: formData.get("sido"),
    sigungu: formData.get("sigungu") || undefined,
    address: formData.get("address"),
    lat: formData.get("lat") || undefined,
    lng: formData.get("lng") || undefined,
    phone: formData.get("phone") || undefined,
    hours: formData.get("hours") || undefined,
    url: formData.get("url") || undefined,
    is_official: formData.get("is_official") === "on",
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) return { error: "입력을 확인하세요 (매장명·시도·주소 필수, 좌표/URL 형식)" };
  const d = parsed.data;

  const { error } = await supabase.from("shops").insert({
    name: d.name,
    sido: d.sido,
    sigungu: d.sigungu ?? null,
    address: d.address,
    lat: typeof d.lat === "number" ? d.lat : null,
    lng: typeof d.lng === "number" ? d.lng : null,
    phone: d.phone ?? null,
    hours: d.hours ?? null,
    url: d.url || null,
    is_official: d.is_official ?? false,
    note: d.note ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath("/shops");
  return { ok: `"${d.name}" 등록됨` };
}

export async function deleteShop(id: string): Promise<void> {
  const { supabase } = await requireStaff();
  await supabase.from("shops").delete().eq("id", id);
  revalidatePath("/shops");
}
