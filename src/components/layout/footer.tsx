import Link from "next/link";
import { MessageSquare, Youtube, Mail } from "lucide-react";
import { NAV_ITEMS, SITE } from "@/lib/constants";
import { LogoMark } from "@/components/ui/logo";

const TOOLS = [
  { href: "/", label: "덱 티어리스트" },
  { href: "/cards", label: "카드 정보" },
  { href: "/rules", label: "룰 & 용어" },
  { href: "/trading", label: "카드 시세" },
  { href: "/tournaments", label: "대회 정보" },
];

export function Footer() {
  return (
    <footer className="mt-space-3xl w-full bg-surface-container-low shadow-[0_-4px_20px_-2px_rgba(99,102,241,0.04)]">
      <div className="mx-auto max-w-[1280px] px-gutter-desktop py-space-2xl">
        <div className="mb-space-2xl grid grid-cols-1 gap-space-xl md:grid-cols-4">
          <div className="space-y-space-sm md:col-span-2">
            <div className="flex items-center gap-2.5">
              <LogoMark className="h-8 w-auto rounded-md" />
              <span className="font-display text-headline-sm font-extrabold text-primary">
                리프트 리포트
              </span>
              <span className="rounded-full bg-surface-container-high px-space-xs py-0.5 text-label-sm text-on-surface-variant">
                커뮤니티
              </span>
            </div>
            <p className="max-w-md text-body-sm text-on-surface-variant">
              {SITE.description}. 공정한 플레이와 건강한 커뮤니티 문화를 함께 만들어갑니다.
            </p>
            <p className="text-body-sm text-on-surface-variant">
              비공식 팬 사이트입니다. Riftbound / League of Legends 관련 자산의 저작권은 Riot Games 에 있습니다.
            </p>
          </div>

          <div>
            <h4 className="mb-space-sm font-display text-title-md font-bold text-on-surface">메뉴</h4>
            <ul className="space-y-space-xs text-body-sm text-on-surface-variant">
              {TOOLS.map((t) => (
                <li key={t.href}>
                  <Link href={t.href} className="transition-colors hover:text-primary">
                    {t.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/community" className="transition-colors hover:text-primary">
                  커뮤니티 게시판
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-space-sm font-display text-title-md font-bold text-on-surface">지원</h4>
            <div className="flex flex-col gap-space-xs text-body-sm text-on-surface-variant">
              <span className="inline-flex items-center gap-space-xs">
                <MessageSquare className="h-[18px] w-[18px]" /> 디스코드 커뮤니티
              </span>
              <span className="inline-flex items-center gap-space-xs">
                <Youtube className="h-[18px] w-[18px]" /> 유튜브 채널
              </span>
              <span className="inline-flex items-center gap-space-xs">
                <Mail className="h-[18px] w-[18px]" /> 문의 및 제보
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-space-sm border-t border-outline-variant/60 pt-space-lg text-body-sm text-on-surface-variant sm:flex-row">
          <p>
            © {new Date().getFullYear()} {SITE.nameEn} Hub. Riftbound is a registered trademark of Riot Games.
          </p>
          <div className="flex items-center gap-space-md">
            {NAV_ITEMS.filter((i) => i.href === "/rules").map((i) => (
              <Link key={i.href} href={i.href} className="transition-colors hover:text-on-surface">
                {i.label}
              </Link>
            ))}
            <span>개인정보처리방침</span>
            <span>이용약관</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
