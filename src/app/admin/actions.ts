"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type AdminState = { error?: string; ok?: string };

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
  if (profile?.role !== "editor" && profile?.role !== "admin") {
    redirect("/");
  }
  return { supabase, userId: user.id };
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80) || `item-${Date.now()}`;

const reportSchema = z.object({
  title: z.string().trim().min(2).max(150),
  slug: z.string().trim().max(80).optional(),
  excerpt: z.string().trim().max(400).optional(),
  body: z.string().trim().min(1),
  tag: z.string().trim().max(30).optional(),
  cover_image_url: z.string().trim().url().optional().or(z.literal("")),
  status: z.enum(["draft", "published"]),
});

export async function createReport(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const { supabase, userId } = await requireStaff();
  const parsed = reportSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug") || undefined,
    excerpt: formData.get("excerpt") || undefined,
    body: formData.get("body"),
    tag: formData.get("tag") || undefined,
    cover_image_url: formData.get("cover_image_url") || undefined,
    status: formData.get("status") || "draft",
  });
  if (!parsed.success) return { error: "입력을 확인하세요 (제목 2자+, 본문 필수, 커버는 URL)" };
  const d = parsed.data;

  const { error } = await supabase.from("reports").insert({
    title: d.title,
    slug: d.slug ? slugify(d.slug) : slugify(d.title),
    excerpt: d.excerpt ?? null,
    body: d.body,
    tag: d.tag ?? null,
    cover_image_url: d.cover_image_url || null,
    status: d.status,
    author_id: userId,
    published_at: d.status === "published" ? new Date().toISOString() : null,
  });
  if (error) return { error: error.message };

  revalidatePath("/reports");
  return { ok: `리포트 "${d.title}" 저장됨` };
}

const tournamentSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().max(4000).optional(),
  format: z.string().trim().max(60).optional(),
  starts_at: z.string().min(1),
  ends_at: z.string().optional(),
  location: z.string().trim().max(120).optional(),
  is_online: z.boolean().optional(),
  organizer: z.string().trim().max(80).optional(),
  registration_url: z.string().trim().url().optional().or(z.literal("")),
  prize_pool: z.string().trim().max(120).optional(),
  banner_url: z.string().trim().url().optional().or(z.literal("")),
  status: z.enum(["upcoming", "ongoing", "finished"]),
});

export async function createTournament(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const { supabase } = await requireStaff();
  const parsed = tournamentSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    description: formData.get("description") || undefined,
    format: formData.get("format") || undefined,
    starts_at: formData.get("starts_at"),
    ends_at: formData.get("ends_at") || undefined,
    location: formData.get("location") || undefined,
    is_online: formData.get("is_online") === "on",
    organizer: formData.get("organizer") || undefined,
    registration_url: formData.get("registration_url") || undefined,
    prize_pool: formData.get("prize_pool") || undefined,
    banner_url: formData.get("banner_url") || undefined,
    status: formData.get("status") || "upcoming",
  });
  if (!parsed.success) return { error: "입력을 확인하세요 (이름·시작일시 필수, URL 형식 확인)" };
  const d = parsed.data;

  const { error } = await supabase.from("tournaments").insert({
    name: d.name,
    slug: d.slug ? slugify(d.slug) : slugify(d.name),
    description: d.description ?? null,
    format: d.format ?? null,
    starts_at: new Date(d.starts_at).toISOString(),
    ends_at: d.ends_at ? new Date(d.ends_at).toISOString() : null,
    location: d.location ?? null,
    is_online: d.is_online ?? false,
    organizer: d.organizer ?? null,
    registration_url: d.registration_url || null,
    prize_pool: d.prize_pool ?? null,
    banner_url: d.banner_url || null,
    status: d.status,
  });
  if (error) return { error: error.message };

  revalidatePath("/tournaments");
  return { ok: `대회 "${d.name}" 저장됨` };
}

const notificationSchema = z.object({
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().max(1000).optional(),
  href: z.string().trim().max(300).optional(),
  kind: z.enum(["notice", "update", "event"]),
});

export async function createNotification(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const { supabase, userId } = await requireStaff();
  const parsed = notificationSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body") || undefined,
    href: formData.get("href") || undefined,
    kind: formData.get("kind") || "notice",
  });
  if (!parsed.success) return { error: "입력을 확인하세요 (제목 2자 이상)" };
  const d = parsed.data;

  // href 는 사이트 내부 경로(/...)만 허용
  const href = d.href && d.href.startsWith("/") ? d.href : null;

  const { error } = await supabase.from("notifications").insert({
    title: d.title,
    body: d.body ?? null,
    href,
    kind: d.kind,
    created_by: userId,
  });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  revalidatePath("/admin");
  return { ok: `알림 "${d.title}" 발송됨` };
}

export async function deleteNotification(id: string): Promise<AdminState> {
  const { supabase } = await requireStaff();
  const { error } = await supabase.from("notifications").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  revalidatePath("/admin");
  return { ok: "알림을 삭제했습니다" };
}
