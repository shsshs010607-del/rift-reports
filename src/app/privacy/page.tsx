import type { Metadata } from "next";
import { PageHeading } from "@/components/ui/page-heading";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = { title: "개인정보처리방침" };

const UPDATED = "2026년 9월 7일";
const CONTACT = "리바지지 디스코드 커뮤니티 (사이트 하단 채널 링크)를 통해 문의해 주세요.";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="font-display text-title-lg font-bold text-ink">{title}</h2>
      <div className="mt-2 space-y-2 text-body-md leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeading
        title="개인정보처리방침"
        description={`시행일: ${UPDATED}`}
      />

      <p className="text-body-md leading-relaxed text-ink-soft">
        {SITE.name}(이하 “사이트”)은 리프트바운드(Riftbound) TCG 팬 커뮤니티를 운영하며,
        이용자의 개인정보를 아래와 같이 처리합니다. 사이트는 Riot Games 와 무관한 비공식 팬 사이트입니다.
      </p>

      <Section title="1. 수집하는 개인정보 항목">
        <p>사이트는 최소한의 정보만 수집합니다.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-ink">소셜 로그인 시</strong>: 이메일 주소, 닉네임(또는 프로필 이름),
            프로필 이미지 URL. (Google · Kakao · Discord 중 이용자가 선택한 제공자로부터 전달받음)
          </li>
          <li>
            <strong className="text-ink">서비스 이용 과정에서 생성</strong>: 이용자가 직접 작성한 게시글·댓글·덱·거래글,
            추천 기록, 설정한 닉네임.
          </li>
          <li>
            <strong className="text-ink">자동 수집</strong>: 접속 로그, 쿠키, 기기·브라우저 정보(서비스 운영 및 부정 이용 방지 목적).
          </li>
        </ul>
        <p>이름, 전화번호, 주소, 주민등록번호 등은 수집하지 않습니다.</p>
      </Section>

      <Section title="2. 개인정보의 이용 목적">
        <ul className="list-disc space-y-1 pl-5">
          <li>회원 식별 및 로그인 유지</li>
          <li>커뮤니티 게시판·거래글·덱 공유 등 서비스 제공</li>
          <li>공지 전달, 문의 응대, 부정 이용·도용 방지</li>
        </ul>
      </Section>

      <Section title="3. 보유 및 이용 기간">
        <p>
          회원 탈퇴 시 또는 개인정보 수집·이용 목적이 달성되면 지체 없이 파기합니다. 단, 관계 법령에 따라
          보존이 필요한 경우 해당 기간 동안 보관합니다. 이용자가 작성한 게시물은 탈퇴 시 삭제되며,
          다른 이용자의 글에 남은 댓글 등은 작성자 정보가 익명 처리될 수 있습니다.
        </p>
      </Section>

      <Section title="4. 개인정보의 제3자 제공 및 처리 위탁">
        <p>사이트는 개인정보를 외부에 판매하지 않으며, 서비스 운영에 필요한 범위에서 아래 사업자의 인프라를 이용합니다.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-ink">Supabase</strong> — 데이터베이스 및 인증(로그인) 처리
          </li>
          <li>
            <strong className="text-ink">Vercel</strong> — 웹사이트 호스팅 및 접속 로그
          </li>
          <li>
            <strong className="text-ink">Google AdSense</strong> — 광고 게재 및 광고 성과 측정 (아래 5항 참조)
          </li>
        </ul>
        <p>이들 사업자는 서버가 국외에 있을 수 있으며, 각 사업자의 개인정보 처리방침이 함께 적용됩니다.</p>
      </Section>

      <Section title="5. 쿠키 및 Google AdSense 광고">
        <p>
          사이트는 로그인 세션 유지를 위한 쿠키와, 사용자 편의를 위한 로컬 저장소(브라우저 내 저장)를 사용합니다.
        </p>
        <p>
          또한 <strong className="text-ink">Google AdSense</strong> 를 통해 광고를 게재합니다. Google 을 포함한 제3자
          공급업체는 쿠키를 사용하여 이용자의 이 사이트 및 다른 사이트 방문 기록을 바탕으로 광고를 게재할 수 있습니다.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            이용자는{" "}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-strong underline"
            >
              Google 광고 설정
            </a>
            에서 개인 맞춤 광고를 사용 중지할 수 있습니다.
          </li>
          <li>
            <a
              href="https://www.aboutads.info/choices/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-strong underline"
            >
              aboutads.info
            </a>
            에서 타사 공급업체의 쿠키 사용을 일괄 거부할 수 있습니다.
          </li>
          <li>브라우저 설정에서 쿠키 저장을 차단하거나 삭제할 수 있으나, 이 경우 로그인 등 일부 기능이 제한될 수 있습니다.</li>
        </ul>
      </Section>

      <Section title="6. 이용자의 권리">
        <p>
          이용자는 언제든지 자신의 개인정보를 조회·수정하거나 삭제(회원 탈퇴)를 요청할 수 있습니다.
          닉네임·프로필은 로그인 후 프로필 화면에서 직접 변경할 수 있으며, 그 밖의 요청은 아래 문의처로 연락하시면
          지체 없이 처리합니다.
        </p>
      </Section>

      <Section title="7. 만 14세 미만 아동">
        <p>
          사이트는 만 14세 미만 아동의 개인정보를 수집하지 않습니다. 만 14세 미만임이 확인되면 해당 계정과 정보를 삭제합니다.
        </p>
      </Section>

      <Section title="8. 개인정보 보호책임자 및 문의">
        <p>개인정보 처리에 관한 문의·불만·피해구제는 아래로 연락해 주세요.</p>
        <p className="text-ink">{CONTACT}</p>
      </Section>

      <Section title="9. 방침의 변경">
        <p>
          이 방침은 법령·서비스 변경에 따라 수정될 수 있으며, 변경 시 이 페이지를 통해 공지합니다.
        </p>
      </Section>
    </div>
  );
}
