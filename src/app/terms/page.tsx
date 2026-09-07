import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/ui/page-heading";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = { title: "이용약관" };

const UPDATED = "2026년 9월 7일";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="font-display text-title-lg font-bold text-ink">{title}</h2>
      <div className="mt-2 space-y-2 text-body-md leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeading title="이용약관" description={`시행일: ${UPDATED}`} />

      <Section title="1. 목적">
        <p>
          이 약관은 {SITE.name}(이하 “사이트”)이 제공하는 리프트바운드(Riftbound) TCG 팬 커뮤니티 서비스의
          이용 조건을 정합니다. 사이트는 Riot Games 와 무관한 비공식 팬 사이트이며, Riftbound 및 League of Legends
          관련 자산의 저작권은 Riot Games 에 있습니다.
        </p>
      </Section>

      <Section title="2. 회원가입 및 계정">
        <p>
          이용자는 Google · Kakao · Discord 소셜 계정으로 로그인하여 회원이 됩니다. 계정 정보와 활동에 대한 책임은
          이용자 본인에게 있으며, 타인의 계정을 도용해서는 안 됩니다.
        </p>
      </Section>

      <Section title="3. 이용자의 의무">
        <p>이용자는 다음 행위를 해서는 안 됩니다.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>타인을 비방·모욕하거나 명예를 훼손하는 행위</li>
          <li>욕설·차별·혐오·음란물 등 부적절한 콘텐츠 게시</li>
          <li>허위 사실 유포, 사기 목적의 거래글 작성</li>
          <li>스팸·도배·광고, 서비스 운영 방해, 자동화 프로그램을 통한 접근</li>
          <li>타인의 저작권·개인정보 등 권리를 침해하는 행위</li>
        </ul>
      </Section>

      <Section title="4. 게시물의 관리">
        <p>
          이용자가 작성한 게시물의 저작권은 작성자에게 있습니다. 다만 운영자는 위 3항을 위반한 게시물을 사전 통지 없이
          삭제하거나 이용을 제한할 수 있습니다.
        </p>
      </Section>

      <Section title="5. 광고">
        <p>
          사이트는 운영을 위해 Google AdSense 광고를 게재합니다. 광고 관련 쿠키 처리는{" "}
          <Link href="/privacy" className="text-primary-strong underline">
            개인정보처리방침
          </Link>
          을 따릅니다.
        </p>
      </Section>

      <Section title="6. 면책">
        <p>
          사이트가 제공하는 카드 정보·시세·티어리스트 등은 오픈소스 데이터와 커뮤니티 기여를 바탕으로 하며 정확성을
          보장하지 않습니다. 이용자 간 카드 거래로 발생한 분쟁에 대해 사이트는 책임지지 않습니다.
        </p>
      </Section>

      <Section title="7. 약관의 변경">
        <p>이 약관은 필요 시 개정될 수 있으며, 변경 시 이 페이지를 통해 공지합니다.</p>
      </Section>
    </div>
  );
}
