-- ============================================================================
--  아바타 스토리지 버킷 (2026-09-08) — Supabase SQL Editor 에서 Run.
--  프로필 사진 업로드용. 공개 읽기, 본인 폴더(avatars/{uid}/...)에만 쓰기.
-- ============================================================================

insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

drop policy if exists "아바타 공개 읽기" on storage.objects;
drop policy if exists "본인 아바타 업로드" on storage.objects;
drop policy if exists "본인 아바타 수정" on storage.objects;
drop policy if exists "본인 아바타 삭제" on storage.objects;

create policy "아바타 공개 읽기" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "본인 아바타 업로드" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "본인 아바타 수정" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "본인 아바타 삭제" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
