"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useFormState, useFormStatus } from "react-dom";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { updateProfile, setAvatar, type ProfileState } from "@/app/me/actions";
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 2 * 1024 * 1024;

export function ProfileEditor({
  username,
  bio,
  avatarUrl,
}: {
  username: string;
  bio: string | null;
  avatarUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState<ProfileState, FormData>(updateProfile, {});

  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatar, setLocalAvatar] = useState(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setAvatarMsg("이미지 파일만 올릴 수 있어요.");
    if (file.size > MAX_BYTES) return setAvatarMsg("2MB 이하 이미지만 가능해요.");

    setUploading(true);
    setAvatarMsg(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요해요.");

      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const res = await setAvatar(data.publicUrl);
      if (res.error) throw new Error(res.error);

      setLocalAvatar(data.publicUrl);
      router.refresh();
    } catch (err) {
      setAvatarMsg(err instanceof Error ? err.message : "업로드에 실패했어요.");
    } finally {
      setUploading(false);
    }
  }

  async function removeAvatar() {
    setUploading(true);
    setAvatarMsg(null);
    const res = await setAvatar(null);
    setUploading(false);
    if (res.error) return setAvatarMsg(res.error);
    setLocalAvatar(null);
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-ghost !py-2 !text-label-md">
        프로필 편집
      </button>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-4 rounded-2xl border border-line/80 bg-card p-4">
      {/* 아바타 */}
      <div className="flex items-center gap-4">
        <span className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-fixed text-title-md font-bold text-on-primary-fixed-variant">
          {avatar ? (
            <Image src={avatar} alt="" fill sizes="64px" className="object-cover" />
          ) : (
            (username[0] ?? "U").toUpperCase()
          )}
          {uploading && (
            <span className="absolute inset-0 grid place-items-center bg-scrim/50">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </span>
          )}
        </span>
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-label-sm font-bold text-ink-soft transition hover:text-ink disabled:opacity-50"
            >
              <Camera className="h-3.5 w-3.5" /> 사진 변경
            </button>
            {avatar && (
              <button
                type="button"
                onClick={removeAvatar}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-label-sm font-bold text-error transition hover:bg-error/10 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> 제거
              </button>
            )}
          </div>
          <p className="text-label-sm text-ink-soft">JPG·PNG·WebP · 2MB 이하</p>
          {avatarMsg && <p className="text-label-sm text-coral">{avatarMsg}</p>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
      </div>

      {/* 닉네임 · 소개 */}
      <form action={formAction} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-label-md font-bold text-ink">닉네임</span>
          <input name="username" defaultValue={username} maxLength={20} required className="field" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-label-md font-bold text-ink">소개</span>
          <textarea
            name="bio"
            defaultValue={bio ?? ""}
            maxLength={300}
            rows={3}
            placeholder="한 줄 소개 (선택)"
            className="field"
          />
        </label>

        {state.error && <p className="text-body-sm text-coral">{state.error}</p>}
        {state.ok && <p className="text-body-sm text-emerald">저장했습니다.</p>}

        <div className="flex gap-2">
          <Save />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="btn-ghost !py-2 !text-label-md"
          >
            닫기
          </button>
        </div>
      </form>
    </div>
  );
}

function Save() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary !py-2 !text-label-md">
      {pending ? "저장 중…" : "저장"}
    </button>
  );
}
