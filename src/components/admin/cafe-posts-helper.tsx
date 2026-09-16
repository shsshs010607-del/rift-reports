"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type CafePost = {
  shop: string;
  title: string;
  date: string;
  images?: string[];
  body: string;
};

const POSTS: CafePost[] = [
  {
    shop: "송내 리프레시",
    title: "넥서스 나이트 접수 공지 안내",
    date: "09.15 12:05",
    body: `[매장 소식] [송내 리프레시] 넥서스 나이트 접수 공지 안내

날짜: 9/18(금) 오후 19:30 시작
참가비: 무료
참가상: 넥서스 나이트 프로모션 팩 1팩
상품: 인원에 따라 수량 조정 (넥서스 나이트 프로모션 팩 + 릴리즈 이벤트 프라이즈 팩)
최대 정원: 16인

정원 미달 시, 잔여 프로모 팩은 상위 입상자 혹은 행운상으로 증정됩니다.
*경품 지급은 이벤트 종료 시점에 배포됩니다.
*게임에 필요한 준비물이 없으실 경우 참가가 제한됩니다.
*사전 구성된 징크스 챔피언 덱의 내용물과 완전히 동일한 덱을 사용하는 경우 금지카드를 사용하실 수 있습니다.

스위스 단판전 4라운드 진행 예정이며 대회 시작 20분 전부터 현장접수 예정이며, 16인 초과 시 시작 5분 전까지 명단 접수 후 추첨제로 진행할 예정입니다.

저희 리프레시는 공지드린 대로 '현장접수'입니다! 대회 시작 5분 전까지 현장 접수 후 추첨제로 결정할 예정이니 공지 확인 부탁드립니다. 감사합니다.`,
  },
  {
    shop: "불광카드샵와우",
    title: "넥서스나이트 · 평일 정규리그 9월 2주차 스케줄",
    date: "09.15 12:59",
    images: ["bulgwang_cardshopwow_1.png", "bulgwang_cardshopwow_2.png"],
    body: `[매장 소식] [불광카드샵와우] 넥서스나이트, 평일 정규리그 9월 2주차 스케줄입니다

화요일 · 금요일 정규리그
- 시간: PM 08:00
- 참가비: 5,000원
- 상품: 인원대비 상품 분배

넥서스 나이트
- 시간: AM 11:30
- 참가비: 무료
- 상품: 프로모 배포 예정`,
  },
  {
    shop: "어바웃티씨지 (구로)",
    title: "대회 관련 & 발매일 현장 판매 공지",
    date: "09.15 13:29",
    images: ["abouttcg_1.png"],
    body: `[매장 소식] [어바웃티씨지] 대회관련 & 발매일 현장 판매 공지

안녕하세요, 어바웃티씨지입니다.

라이엇 공식 홈페이지에 저희 매장 이벤트가 등록되면서 사전 신청이 가능했던 점, 저희가 사전에 인지하지 못해 혼선을 드려 죄송합니다.

■ 9월 18일 넥서스 나이트
- 기존 공지대로 현장 선착순 접수로 진행됩니다.
- 라이엇 공식 홈페이지를 통해 사전 신청하신 내역은 모두 취소 처리하였습니다.
- 9월 18일 매장 오픈 시간(오후 1시)부터 현장 선착순 접수를 진행합니다.
- 대리·중복 접수 방지를 위해 접수 시 신분증 확인이 진행됩니다.

■ 9월 24일 스토어 예선
- 접수 방식이 아직 확정되지 않아, 사전 신청 내역은 우선 취소 처리했습니다.
- 접수 방식·일정은 추후 별도 공지 예정입니다.

■ 9월 18일 발매일 현장 판매
- 현장 구매 가능: 챔피언 덱 3종, 증명의 전장
- 14장들이 팩은 전량 소진, 5장들이 팩도 극소량만 남아 있어 발매일 현장구매는 불가합니다.

★매장안내★
주소: 서울특별시 관악구 조원로 16 로얄빌딩 2층
카카오톡 오픈채팅방: 어바웃티씨지 리프트바운드 검색
문의: 어바웃티씨지 카카오채널 / 02-6958-6567
트위터: https://x.com/AbouttcgA96662`,
  },
  {
    shop: "하비게임몰 종로점",
    title: "프리미엄 샵 및 공식 이벤트 운영 안내",
    date: "09.15 13:38",
    images: ["hobbygamemall_jongno_1.png"],
    body: `[매장 소식] [하비게임몰 종로점] 프리미엄 샵 및 공식 이벤트 운영 안내

안녕하세요, 하비게임몰 종로점입니다.
하비게임몰 종로점이 프리미엄 샵으로 인사드리게 되었습니다.

앞으로 다양한 정기 이벤트와 함께 넥서스 나이트 및 스토어 예선 등 주요 공식 이벤트를 진행합니다. 보다 공정한 참가 기회를 위해 아래 방식으로 참가자를 선정합니다.

■ 참가 및 추첨 방식
- 이벤트 참가 신청은 당일 현장 신청으로 진행됩니다.
- 신청 인원이 정원을 초과하면 이벤트 시작 5분 전 현장 추첨을 진행합니다.
- 추첨 시 반드시 매장에 계셔야 하며, 계시지 않으면 추첨 대상에서 제외됩니다.
- 라이엇 공식 홈페이지로 사전 등록하신 내역은 모두 취소 처리되었습니다.
- 현장 신청 시 신분증 확인이 진행됩니다.
- 정원 이내 신청 시 별도 추첨 없이 참가 가능합니다.
- 스토어 예선 일정은 추후 업데이트 예정입니다.

많은 관심과 참여 부탁드립니다. 감사합니다.`,
  },
  {
    shop: "천안 카드빌리지",
    title: "미니리그 일정 변경에 대한 공지",
    date: "09.15 17:30",
    images: ["cheonan_cardvillage_scheduleChange_1.png"],
    body: `[매장 소식] 천안 카드빌리지 미니리그 일정 변경에 대한 공지

넥서스 나이트 및 내부 사정으로 인해 일정이 변경됨을 알려드리기 위해 본 게시글을 작성합니다.

참고: 돌아오는 대회는 넥서스 나이트 및 내부 일정으로 인해 목요일로 앞당겨 개최하기로 결정되었습니다. 일요일에 시간을 내어주시는 모든 분들께 너른 양해 부탁드립니다.

이용해 주시는 유저분들의 너른 양해 부탁드립니다.`,
  },
  {
    shop: "건대킨들샵",
    title: "공인 이벤트 관련 중요 공지",
    date: "09.15 18:03",
    body: `[매장 소식] [건대킨들샵] 킨들샵 공인 이벤트 관련 중요 공지 안내드립니다

안녕하세요 킨들샵입니다.
공인 이벤트 사전 접수 방식의 공정성과 관련해 다양한 의견과 문의가 있었습니다. 논의 결과, 9월 공인 이벤트는 다음과 같이 진행됩니다.

■ 9/18, 9/25 넥서스 나이트
Playriftbound에서 사전접수한 온라인 인원 그대로 예약을 확정합니다. 공석 발생 시 현장 선착순 접수로 진행합니다.

■ 9/27 스토어 예선
마찬가지로 Playriftbound 사전접수 인원 그대로 확정, 공석은 현장 선착순. 예선 엔트리는 32인에서 확장 예정이며 구체적인 수·일정은 추가 안내 예정입니다.

10월 이후 공인 이벤트 접수 방식에도 변화를 줄 예정이며, 9월간 받은 의견을 최대한 반영하겠습니다. 늘 보내주시는 성원에 감사드립니다.

킨들샵 디스코드: https://discord.gg/wSsMMPqxEm`,
  },
  {
    shop: "천안 카드빌리지",
    title: "9/19(토) 넥서스 나이트 안내",
    date: "09.15 18:35",
    images: ["cheonan_cardvillage_nexus_1.png"],
    body: `[매장 소식] 9/19(토) 천안 카드빌리지 리프트바운드 넥서스 나이트 안내

(공지 내용은 첨부 이미지 그대로입니다 — 아래 사진 참고)`,
  },
  {
    shop: "부산 미니빌",
    title: "2026.9.19(토) 넥서스 나이트 공지",
    date: "09.15 21:18",
    images: ["busan_minivil_1.jpg"],
    body: `[매장 소식] [부산 미니빌] 2026.9.19(토) 넥서스 나이트 공지

안녕하세요 미니빌입니다!

리프트바운드 넥서스 나이트
- 대회 시작: 2026년 9월 19일 오후 7시
- 당일 현장 접수만 진행 (전화·대리 접수 불가, 신분증 확인 있음)
- 매장 오픈부터 대회 시작 10분 전까지 접수
- 시작 10분 전 인원 체크 후 정원 초과 시 현장 추첨으로 24인 확정

참가비: 무료 (대회참가인원은 별도 매장이용료 있음)
참가정원: 24인
진행 방식: 참가자 수에 따른 Bo1 스위스 라운드
사용제한: 정식발매판과 동일 카드면 해외판도 가능, 글로벌 밴 리스트 적용 (스타터덱 그대로 사용 시 밴 리스트 무관하게 사용 가능)

참가상: 넥서스 나이트 프로모팩 1팩 & 출시 기념 프로모 팩 1팩
전승자 우승상: 출시 기념 프로모 팩 1팩

매장 이용료: 별다른 안내 없으면 5,000원(음료 포함, 음료 가격에 따라 변동 가능)

[오시는길] 부산 부산진구 중앙대로692번길 33 4층 미니빌
[영업시간] 평일 13:00~23:00 / 주말 12:00~23:00

감사합니다!`,
  },
  {
    shop: "주안 티씨지아레나",
    title: "오리진 현장판매 · 초심자 이벤트 · 넥서스나이트",
    date: "09.15 21:59",
    images: ["juan_tcgarena_1.png", "juan_tcgarena_2.png", "juan_tcgarena_3.png", "juan_tcgarena_4.png"],
    body: `[매장 소식] [주안 티씨지아레나] 오리진 현장판매, 초심자 이벤트, 넥서스나이트 안내

안녕하세요, 주안 티씨지아레나입니다.

리프트바운드의 대망의 신팩, 오리진 발매가 임박하였습니다.
이에 따라 리프트바운드 관련 당점 소식을 전해드리오니 이용에 참고 바랍니다.

(자세한 내용은 첨부 이미지 4장 참고)`,
  },
  {
    shop: "리즈스튜디오 TCG",
    title: "리프트바운드 취급점 이벤트 안내",
    date: "09.16 15:40",
    images: ["lizstudio_1.png"],
    body: `[매장 소식] 리즈스튜디오TCG — 리프트바운드 취급점 이벤트 안내

Lizstudio TCG

안녕하세요 리프트바운드 취급점 리즈스튜디오TCG입니다.
이번에 리프트바운드를 취급하게 되어 출시일에 맞춰 이벤트를 준비했습니다.

현재 매장에 5p부스터와 스타터덱 3종이 구매 가능합니다.
부스터는 현장 구매로 진행할 예정입니다. 금요일 오픈시간은 오후 4시입니다.

많은 관심 부탁드립니다. 감사합니다.`,
  },
  {
    shop: "롤링다이스 평택 험프리스점",
    title: "넥서스나이트 등 이벤트 안내",
    date: "09.16 16:28",
    images: ["rollingdice_pyeongtaek_1.png"],
    body: `[매장 소식] [롤링다이스 평택] 넥서스나이트 등 이벤트 안내

안녕하세요, 롤링다이스 평택 험프리스점입니다.

1. 넥서스나이트 관련
현재 [일요일 오후 3시]에 넥서스나이트를 진행할 예정입니다. 지리상 접근이 쉽지 않고 주변 매장과 중복을 피하기 위해 주말로 선정했습니다.
미군부대 행사로 인한 통제 등으로 일정이 변경될 수 있으며, 변경 시 이벤트 로케이터(playriftbound 공식 사이트)에서 확인 가능합니다. 이벤트 추가는 금요일 저녁 10시 공개를 목표로 합니다.

접수 절차:
1) 기본적으로 이벤트 로케이터를 통한 선착순 접수 (현재 신청인 5인)
2) 로케이터 24인이 모두 찰 경우, 해당 이벤트까지는 로케이터 기반 선착순 + 예비번호는 현장 접수
3) 이후엔 구글폼 사전접수 → 목요일 21시 접수 마감 → 금요일 16시 결과·랜덤순번 안내. 이벤트 10분 전까지 체크인 필요, 늦으면 후순위 처리.

이벤트는 BO1 최대 4라운드, 부스터는 당일소진 원칙(참가팩 외 물량은 N명이 나눠가진 후 잔여분 추첨). 초기 4주간 릴리즈 이벤트 프라이즈 팩 제공 가능성 있음(수량 확인 후 안내).

한국은 국제 밴 리스트를 그대로 적용합니다. 9월 18일부터 적용되는 [속임수 덱]과 [에코 - 반복..]은 사용 불가하니 유의 바랍니다(스타터덱 그대로 사용 시 예외).

2. 오리진 스토어 예선 관련
9월 본점 스토어 예선은 진행하지 않으며, 대신 부스터박스 등을 건 비공인 대회를 9월 26일(토) 목표로 기획 중입니다. 참가비 있음, 경쟁REL 수준으로 진행 예정 — 결정되면 별도 공지.

3. 매장 문의 및 공지
디스코드로 매장 공지·커뮤니티를 운영합니다. 문의는 가입 후 Riftbound 문의채널 또는 DM으로 부탁드립니다.
디스코드: https://discord.gg/brC6RNkBV7`,
  },
  {
    shop: "카드냥 토너먼트센터",
    title: "넥서스 나이트 이벤트 접수 방식 변경 안내",
    date: "09.16 17:01",
    body: `[매장 소식] [카드냥 토너먼트센터] 넥서스 나이트 이벤트 접수 방식 변경 안내

안녕하세요, 카드냥입니다.

넥서스 나이트 이벤트가 동시에 여러 건 개설되면서 참가 신청이 모든 플레이어분들께 공평하게 진행되지 못한 점을 확인했습니다.

이에 기존 사전 접수를 그대로 유지하는 대신, 사전에 접수된 모든 신청을 취소하고 이벤트 당일 현장 접수만으로 참가 신청을 진행하기로 결정했습니다. 접수 방식 변경 안내가 늦어진 점 사과드립니다.

■ 참가 접수 방식
- 기존 사전 접수: 전부 취소
- 변경 후 접수: 이벤트 당일 현장 접수
※ 현재 사전 접수된 신청은 금일 18:00까지 모두 취소 처리됩니다.

이용에 혼선을 드려 죄송합니다. 보다 원활하고 공정하게 이벤트가 진행될 수 있도록 준비하겠습니다. 감사합니다.`,
  },
];

const IMG_BASE = "/admin/cafe-posts/";

export function CafePostsHelper() {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  async function copy(idx: number, text: string) {
    try {
      if (window.isSecureContext && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error("insecure context");
      }
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        return;
      }
    }
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx((v) => (v === idx ? null : v)), 1800);
  }

  return (
    <div className="flex flex-col gap-4">
      {POSTS.map((p, idx) => (
        <article key={idx} className="note-card overflow-hidden">
          <div className="flex items-start justify-between gap-3 border-b border-line p-4">
            <div className="min-w-0">
              <p className="mb-0.5 text-label-sm font-bold uppercase tracking-wide text-primary-strong">
                {p.shop}
              </p>
              <h3 className="text-body-md font-bold text-ink">{p.title}</h3>
            </div>
            <time className="shrink-0 text-label-sm text-ink-soft tabular-nums">{p.date}</time>
          </div>

          <div className="p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => copy(idx, p.body)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-label-md font-bold transition",
                  copiedIdx === idx
                    ? "bg-ink text-canvas"
                    : "bg-primary text-white hover:bg-primary-container",
                )}
              >
                {copiedIdx === idx ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedIdx === idx ? "복사됨" : "복사하기"}
              </button>
              <span className="text-label-sm text-ink-soft">
                {p.images?.length ? `사진 ${p.images.length}장` : "사진 없음"}
              </span>
            </div>

            <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-line bg-subcanvas/60 p-3 font-mono text-[12.5px] leading-relaxed text-ink">
              {p.body}
            </pre>

            {p.images && p.images.length > 0 && (
              <>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {p.images.map((img) => (
                    <a
                      key={img}
                      href={IMG_BASE + img}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-lg border border-line bg-subcanvas"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={IMG_BASE + img}
                        alt={`${p.shop} 공지 이미지`}
                        className="aspect-[3/4] w-full object-cover"
                        loading="lazy"
                      />
                    </a>
                  ))}
                </div>
                <p className="mt-1.5 flex items-center gap-1 text-label-sm text-ink-soft">
                  <ExternalLink className="h-3 w-3" />
                  사진 클릭 → 원본 크기로 열림. 카페 글쓰기창의 사진 버튼으로 그대로 업로드하거나, 열린 사진을 우클릭해서 복사·저장하세요.
                </p>
              </>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
