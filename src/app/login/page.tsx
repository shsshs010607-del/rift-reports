import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "로그인" };

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <div className="mx-auto max-w-md py-8">
      <h1 className="text-center font-display text-headline-md text-ink">리바지지 로그인</h1>
      <p className="mt-2 text-center text-body-md text-ink-soft">
        이메일 매직 링크 또는 소셜 계정으로 로그인하세요.
      </p>
      <div className="surface mt-6 p-6">
        <LoginForm next={searchParams.next} />
      </div>
      <p className="mt-4 text-center text-body-sm text-ink-soft">
        로그인 시{" "}
        <Link href="/terms" className="underline hover:text-ink">
          이용약관
        </Link>
        과{" "}
        <Link href="/privacy" className="underline hover:text-ink">
          개인정보처리방침
        </Link>
        에 동의하는 것으로 간주됩니다.
      </p>
    </div>
  );
}
