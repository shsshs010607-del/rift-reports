import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid place-items-center py-24 text-center">
      <p className="font-display text-display-hero text-primary">404</p>
      <p className="mt-2 text-body-lg text-ink-soft">요청하신 페이지를 찾을 수 없습니다.</p>
      <Link href="/" className="btn-primary mt-6">
        홈으로
      </Link>
    </div>
  );
}
