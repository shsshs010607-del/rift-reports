import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { PageHeading } from "@/components/ui/page-heading";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ProfileEditor } from "@/components/me/profile-editor";
import { getMyPosts, getMyListings } from "@/lib/me";
import { listMyDecks } from "@/lib/actions/decks";
import { COMMUNITY_CATEGORIES, TRADING_CATEGORIES, TRADE_STATUS } from "@/lib/constants";

export const metadata: Metadata = { title: "내 프로필" };
export const dynamic = "force-dynamic";

const CAT = new Map(COMMUNITY_CATEGORIES.map((c) => [c.slug, c.label]));
const TCAT = new Map(TRADING_CATEGORIES.map((c) => [c.slug, c.label]));
const TSTATUS = new Map(TRADE_STATUS.map((s) => [s.slug, s.label]));

export default async function MePage() {
  if (!hasSupabaseEnv) redirect("/login");
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/me");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  const [posts, listings, decks] = await Promise.all([
    getMyPosts(data.user.id),
    getMyListings(data.user.id),
    listMyDecks(),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeading title={profile?.username ?? "내 프로필"} description={data.user.email ?? undefined} />

      {profile && !profile.onboarded && (
        <a
          href="/onboarding?next=/me"
          className="mb-4 block rounded-xl border border-primary/30 bg-primary-wash/60 p-3 text-body-sm font-semibold text-primary-strong"
        >
          아직 닉네임을 설정하지 않았어요. 지금 설정하기 →
        </a>
      )}

      <div className="surface p-4">
        <div className="flex items-center gap-3">
          <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-fixed text-title-md font-bold text-on-primary-fixed-variant">
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt="" fill sizes="48px" className="object-cover" />
            ) : (
              (profile?.username ?? "U")[0].toUpperCase()
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-title-md font-bold text-ink">{profile?.username}</p>
            <p className="text-body-sm text-ink-soft">
              {profile?.bio || `역할: ${profile?.role ?? "user"}`}
            </p>
          </div>
          <SignOutButton />
        </div>
        {profile && <ProfileEditor username={profile.username} bio={profile.bio} />}
      </div>

      <section className="mt-8">
        <h2 className="section-title mb-3">
          내가 쓴 글 <span className="text-body-sm font-normal text-ink-soft">{posts.length}</span>
        </h2>
        {posts.length === 0 ? (
          <p className="rounded-2xl border border-line bg-card p-6 text-center text-body-sm text-ink-soft">
            작성한 글이 없습니다.
          </p>
        ) : (
          <ul className="divide-y divide-line/70 overflow-hidden rounded-2xl border border-line/80 bg-card">
            {posts.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/community/post/${p.id}`}
                  className="flex items-center gap-3 p-3 hover:bg-subcanvas/50"
                >
                  <span className="chip shrink-0">{CAT.get(p.category) ?? p.category}</span>
                  <span className="min-w-0 flex-1 truncate text-body-md text-ink">{p.title}</span>
                  <time className="shrink-0 text-label-sm text-ink-soft" dateTime={p.created_at}>
                    {format(new Date(p.created_at), "MM.dd", { locale: ko })}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="section-title mb-3">
          내 거래글 <span className="text-body-sm font-normal text-ink-soft">{listings.length}</span>
        </h2>
        {listings.length === 0 ? (
          <p className="rounded-2xl border border-line bg-card p-6 text-center text-body-sm text-ink-soft">
            등록한 거래글이 없습니다.
          </p>
        ) : (
          <ul className="divide-y divide-line/70 overflow-hidden rounded-2xl border border-line/80 bg-card">
            {listings.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/trading/${l.id}`}
                  className="flex items-center gap-3 p-3 hover:bg-subcanvas/50"
                >
                  <span className="chip shrink-0">{TCAT.get(l.category)}</span>
                  <span className="min-w-0 flex-1 truncate text-body-md text-ink">{l.title}</span>
                  <span className="shrink-0 text-label-sm text-ink-soft">
                    {TSTATUS.get(l.status)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="section-title mb-3">
          저장한 덱 <span className="text-body-sm font-normal text-ink-soft">{decks.length}</span>
        </h2>
        {decks.length === 0 ? (
          <p className="rounded-2xl border border-line bg-card p-6 text-center text-body-sm text-ink-soft">
            <Link href="/deck-simulator" className="font-bold text-primary-strong">
              덱 시뮬레이터
            </Link>
            에서 덱을 만들고 저장해 보세요.
          </p>
        ) : (
          <ul className="divide-y divide-line/70 overflow-hidden rounded-2xl border border-line/80 bg-card">
            {decks.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/deck-simulator?d=${encodeURIComponent(d.code)}`}
                  className="flex items-center gap-3 p-3 hover:bg-subcanvas/50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body-md text-ink">{d.name}</span>
                    {d.legend_name && (
                      <span className="block truncate text-label-sm text-ink-soft">
                        {d.legend_name}
                      </span>
                    )}
                  </span>
                  <time className="shrink-0 text-label-sm text-ink-soft" dateTime={d.updated_at}>
                    {format(new Date(d.updated_at), "MM.dd", { locale: ko })}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
