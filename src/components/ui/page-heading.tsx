export function PageHeading({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-6">
      <h1 className="font-display text-headline-lg text-ink">{title}</h1>
      {description && <p className="mt-1 text-body-lg text-ink-soft">{description}</p>}
    </header>
  );
}

/** 아직 구현되지 않은 화면용 임시 표시 */
export function ComingSoon({ note }: { note?: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border-2 border-dashed border-line bg-subcanvas/40 px-6 py-20 text-center">
      <p className="font-display text-title-md text-ink">화면 준비 중</p>
      {note && <p className="mt-1 max-w-md text-body-sm text-ink-soft">{note}</p>}
    </div>
  );
}
