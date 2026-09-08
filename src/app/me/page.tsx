import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FileText, Store, Layers } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { fmtKstDate, fmtKstListTime } from "@/lib/datetime";
import { Children } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { ProfileEditor } from "@/components/me/profile-editor";
import { CollectionEditor } from "@/components/me/collection-editor";
import { PagedRows } from "@/components/me/paged-rows";
import { getMyPosts, getMyListings } from "@/lib/me";
import { getMyCollection } from "@/lib/collection";
import { listMyDecks } from "@/lib/actions/decks";
import { COMMUNITY_CATEGORIES, TRADING_CATEGORIES, TRADE_STATUS } from "@/lib/constants";

export const metadata: Metadata = { title: "내 프로필" };
export const dynamic = "force-dynamic";

const CAT = new Map(COMMUNITY_CATEGORIES.map((c) => [c.slug, c.label]));
const TCAT = new Map(TRADING_CATEGORIES.map((c) => [c.slug, c.label]));
const TSTATUS = new Map(TRADE_STATUS.map((s) => [s.slug, s.label]));

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  admin: { label: "운영자", cls: "bg-secondary-fixed text-on-secondary-fixed-variant" },
  editor: { label: "에디터", cls: "bg-primary-fixed text-on-primary-fixed-variant" },
};

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

  const [posts, listings, decks, collection] = await Promise.all([
    getMyPosts(data.user.id),
    getMyListings(data.user.id),
    listMyDecks(),
    getMyCollection(),
  ]);

  const username = profile?.username ?? "내 프로필";
  const role = profile?.role ?? "user";
  const badge = ROLE_BADGE[role];

  return (
    <div className="mx-auto max-w-2xl">
      {profile && !profile.onboarded && (
        <a
          href="/onboarding?next=/me"
          className="mb-4 block rounded-xl border border-primary/30 bg-primary-wash/60 p-3 text-body-sm font-semibold text-primary-strong"
        >
          아직 닉네임을 설정하지 않았어요. 지금 설정하기 →
        </a>
      )}

      {/* ── 프로필 헤더 ── */}
      <div className="overflow-hidden rounded-3xl border border-line/70 bg-card">
        <div className="h-24 bg-gradient-to-r from-primary/30 via-primary/12 to-transparent" />
        <div className="-mt-12 px-5 pb-5 sm:px-7">
          <div className="flex items-end gap-4">
            <span className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-fixed text-headline-md font-black text-on-primary-fixed-variant ring-4 ring-card">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt="" fill sizes="96px" className="object-cover" />
              ) : (
                username[0]?.toUpperCase() ?? "U"
              )}
            </span>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-headline-sm font-bold text-ink">{username}</h1>
                {badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-label-sm font-black ${badge.cls}`}
                  >
                    {badge.label}
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-body-sm text-ink-soft">
                {data.user.email}
                {profile?.created_at && ` · ${fmtKstDate(profile.created_at)} 가입`}
              </p>
            </div>
            <div className="pb-1">
              <SignOutButton />
            </div>
          </div>

          {profile?.bio && (
            <p className="mt-3 whitespace-pre-wrap text-body-md leading-relaxed text-ink">
              {profile.bio}
            </p>
          )}

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label="쓴 글" value={posts.length} />
            <Stat label="거래글" value={listings.length} />
            <Stat label="저장 덱" value={decks.length} />
          </div>

          {profile && (
            <div className="mt-4">
              <ProfileEditor
                username={profile.username}
                bio={profile.bio}
                avatarUrl={profile.avatar_url}
              />
            </div>
          )}
        </div>
      </div>

      <CollectionEditor initial={collection} />

      <ListSection
        title="내가 쓴 글"
        icon={<FileText className="h-4 w-4" />}
        count={posts.length}
        empty="작성한 글이 없습니다."
      >
        {posts.map((p) => (
          <Row key={p.id} href={`/community/post/${p.id}`} when={p.created_at}>
            <span className="chip shrink-0">{CAT.get(p.category) ?? p.category}</span>
            <span className="min-w-0 flex-1 truncate text-body-md text-ink">{p.title}</span>
          </Row>
        ))}
      </ListSection>

      <ListSection
        title="내 거래글"
        icon={<Store className="h-4 w-4" />}
        count={listings.length}
        empty="등록한 거래글이 없습니다."
      >
        {listings.map((l) => (
          <Row key={l.id} href={`/trading/${l.id}`}>
            <span className="chip shrink-0">{TCAT.get(l.category)}</span>
            <span className="min-w-0 flex-1 truncate text-body-md text-ink">{l.title}</span>
            <span className="shrink-0 text-label-sm font-bold text-ink-soft">
              {TSTATUS.get(l.status)}
            </span>
          </Row>
        ))}
      </ListSection>

      <ListSection
        title="저장한 덱"
        icon={<Layers className="h-4 w-4" />}
        count={decks.length}
        empty={
          <>
            <Link href="/deck-simulator" className="font-bold text-primary-strong">
              덱 시뮬레이터
            </Link>
            에서 덱을 만들고 저장해 보세요.
          </>
        }
      >
        {decks.map((d) => (
          <Row
            key={d.id}
            href={`/deck-simulator?d=${encodeURIComponent(d.code)}`}
            when={d.updated_at}
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body-md text-ink">{d.name}</span>
              {d.legend_name && (
                <span className="block truncate text-label-sm text-ink-soft">{d.legend_name}</span>
              )}
            </span>
          </Row>
        ))}
      </ListSection>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-subcanvas/60 px-3 py-2.5 text-center">
      <p className="font-display text-title-lg font-black text-ink">{value}</p>
      <p className="text-label-sm font-bold text-ink-soft">{label}</p>
    </div>
  );
}

function ListSection({
  title,
  icon,
  count,
  empty,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  empty: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 flex items-center gap-1.5 text-title-md font-bold text-ink">
        <span className="text-primary">{icon}</span>
        {title}
        <span className="text-body-sm font-normal text-ink-soft">{count}</span>
      </h2>
      {count === 0 ? (
        <p className="note-card p-6 text-center text-body-sm text-ink-soft">{empty}</p>
      ) : (
        <PagedRows items={Children.toArray(children)} perPage={5} />
      )}
    </section>
  );
}

function Row({
  href,
  when,
  children,
}: {
  href: string;
  when?: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-2.5 p-3 transition-colors hover:bg-primary/[0.04]"
      >
        {children}
        {when && (
          <time className="shrink-0 text-label-sm tabular-nums text-ink-soft" dateTime={when}>
            {fmtKstListTime(when)}
          </time>
        )}
      </Link>
    </li>
  );
}
