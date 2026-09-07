/**
 * 카드샵 시드 (2026-09-08). 전국 종합 TCG 매장.
 *   npx tsx scripts/seed-shops.ts
 *
 * - 같은 이름의 매장이 있으면 갱신, 없으면 삽입 (idempotent).
 * - 상세 주소 대신 인근 역/랜드마크로 표기. is_official = false.
 * - 포켓몬 전용샵은 제외.
 * - 정확한 위치·영업 여부·리프트바운드 취급 여부는 방문 전 매장에 직접 확인 (UI 상시 안내).
 * env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { loadEnv, supabaseAdmin } from "./_shared";

loadEnv();

type Seed = { name: string; sido: string; sigungu: string; address: string };

const SHOPS: Seed[] = [
  // ── 서울 ──────────────────────────────────────
  { name: "송파 카드스타", sido: "서울", sigungu: "송파구", address: "잠실새내역 인근" },
  { name: "엘프&에스프레소", sido: "서울", sigungu: "용산구", address: "이태원역 인근" },
  { name: "용산 TCG STATION", sido: "서울", sigungu: "용산구", address: "용산역 아이파크몰" },
  { name: "마포역 커맨더존", sido: "서울", sigungu: "마포구", address: "마포역 인근" },
  { name: "홍대 롤링다이스", sido: "서울", sigungu: "마포구", address: "홍대입구역 인근" },
  { name: "홍대 듀얼베이스", sido: "서울", sigungu: "마포구", address: "홍대입구·서강대역 인근" },
  { name: "논노21", sido: "서울", sigungu: "서초구", address: "남부터미널역 인근" },
  { name: "강변 미카엘", sido: "서울", sigungu: "광진구", address: "강변역 인근" },
  { name: "교대 달무티", sido: "서울", sigungu: "서초구", address: "교대역 인근" },
  { name: "노원역 듀얼존", sido: "서울", sigungu: "노원구", address: "노원역 인근" },
  { name: "DCC카페", sido: "서울", sigungu: "중구", address: "동대문역사문화공원역 인근" },
  { name: "당산 카드홀릭", sido: "서울", sigungu: "영등포구", address: "당산·영등포구청역 인근" },
  { name: "ABOUT TCG", sido: "서울", sigungu: "관악구", address: "구로디지털단지역 인근" },
  { name: "대학로 레드다이스", sido: "서울", sigungu: "종로구", address: "혜화역 대학로" },
  { name: "도곡 듀얼샵", sido: "서울", sigungu: "강남구", address: "매봉역 인근" },
  { name: "목동 듀얼파크", sido: "서울", sigungu: "양천구", address: "목동역 인근" },
  { name: "건대 킨들샵", sido: "서울", sigungu: "성동구", address: "성수역 인근" },
  { name: "아현 카드킹덤", sido: "서울", sigungu: "마포구", address: "아현역 인근" },
  { name: "장한평 마린포드", sido: "서울", sigungu: "동대문구", address: "장한평역 인근" },
  { name: "이수 듀얼파크", sido: "서울", sigungu: "동작구", address: "이수역 인근" },
  { name: "은평 TCG LABO", sido: "서울", sigungu: "은평구", address: "새절역 인근" },
  { name: "신당 카드스퀘어", sido: "서울", sigungu: "중구", address: "신당역 인근" },
  { name: "역삼 카드냥", sido: "서울", sigungu: "강남구", address: "역삼역 인근" },
  { name: "역삼 토너먼트센터", sido: "서울", sigungu: "강남구", address: "역삼역 인근" },
  { name: "등촌 기어타운", sido: "서울", sigungu: "강서구", address: "등촌역 인근" },
  { name: "송파 카드피아", sido: "서울", sigungu: "송파구", address: "가락시장·문정역 인근" },
  { name: "밀짚모자해적단TCG", sido: "서울", sigungu: "서대문구", address: "신촌 연세로" },
  { name: "강북 봉플레이스", sido: "서울", sigungu: "강북구", address: "미아사거리역 인근" },
  { name: "강남 위펀", sido: "서울", sigungu: "강남구", address: "논현로 인근" },
  { name: "콜렉토티시지", sido: "서울", sigungu: "서대문구", address: "홍제·서대문 인근" },
  { name: "구로 카드숲", sido: "서울", sigungu: "관악구", address: "구로디지털단지역 인근" },
  { name: "사당 카드랩", sido: "서울", sigungu: "동작구", address: "사당역 인근" },
  { name: "강동 카드타운", sido: "서울", sigungu: "강동구", address: "천호·강동구청역 인근" },
  { name: "봉천 데쿠데쿠", sido: "서울", sigungu: "관악구", address: "봉천역 인근" },

  // ── 경기 ──────────────────────────────────────
  { name: "서현역 라이프링크", sido: "경기", sigungu: "성남시", address: "서현역 인근" },
  { name: "구리 듀얼파크", sido: "경기", sigungu: "구리시", address: "구리역 인근" },
  { name: "평택 제이미디어", sido: "경기", sigungu: "평택시", address: "팽성읍" },
  { name: "평택 카드빌리지", sido: "경기", sigungu: "평택시", address: "통복시장 인근" },
  { name: "K-MTG 탄현점", sido: "경기", sigungu: "고양시", address: "탄현역 인근" },
  { name: "하비게임몰", sido: "경기", sigungu: "부천시", address: "신중동역 인근" },
  { name: "부천 카페드봉봉", sido: "경기", sigungu: "부천시", address: "부천역 인근" },
  { name: "역곡 스카이스크레이퍼", sido: "경기", sigungu: "부천시", address: "역곡역 인근" },
  { name: "송내 리프레시", sido: "경기", sigungu: "부천시", address: "송내역 인근" },
  { name: "금정 배틀시티", sido: "경기", sigungu: "군포시", address: "금정역 인근" },
  { name: "일산 듀얼팩토리", sido: "경기", sigungu: "고양시", address: "백석역 인근" },
  { name: "야탑 배틀시티", sido: "경기", sigungu: "성남시", address: "야탑역 인근" },
  { name: "대화 듀얼위너", sido: "경기", sigungu: "고양시", address: "대화역 인근" },
  { name: "수원 카드플래닛", sido: "경기", sigungu: "수원시", address: "영통구" },
  { name: "수원 TCG TracerZ", sido: "경기", sigungu: "수원시", address: "장안구" },
  { name: "평택 카드홀릭", sido: "경기", sigungu: "평택시", address: "평택역 인근" },
  { name: "안양 트레이너스", sido: "경기", sigungu: "안양시", address: "평촌역 인근" },
  { name: "남양주 로이쿠지", sido: "경기", sigungu: "남양주시", address: "홍유릉로" },
  { name: "이천 정무샵", sido: "경기", sigungu: "이천시", address: "이천 시내" },
  { name: "김포 카드베이스", sido: "경기", sigungu: "김포시", address: "운양역 인근" },
  { name: "안성 하얀숲 카드하우스", sido: "경기", sigungu: "안성시", address: "안성 시내" },
  { name: "안산 LAS TCG", sido: "경기", sigungu: "안산시", address: "안산 시내" },
  { name: "수내 카드빈", sido: "경기", sigungu: "성남시", address: "수내역 인근" },

  // ── 인천 ──────────────────────────────────────
  { name: "송도 TPZ", sido: "인천", sigungu: "연수구", address: "지식정보단지역 인근" },
  { name: "인천 타이쿤", sido: "인천", sigungu: "미추홀구", address: "인하대 후문 인근" },
  { name: "만수 ILT듀얼존", sido: "인천", sigungu: "남동구", address: "만수역 인근" },
  { name: "위치스 브루", sido: "인천", sigungu: "계양구", address: "경인교대입구역 인근" },
  { name: "인천 카드팝", sido: "인천", sigungu: "부평구", address: "부평역 인근" },
  { name: "주안 티씨지아레나", sido: "인천", sigungu: "미추홀구", address: "주안역 인근" },
  { name: "부평 히어로즈", sido: "인천", sigungu: "부평구", address: "부평역 인근" },
  { name: "TCG 새틀라이트", sido: "인천", sigungu: "부평구", address: "굴포천역 인근" },

  // ── 대전 ──────────────────────────────────────
  { name: "대전 듀얼몰", sido: "대전", sigungu: "서구", address: "둔산동 세이브존 인근" },
  { name: "TCG카드캐피탈", sido: "대전", sigungu: "중구", address: "태평동" },
  { name: "대전 TCG스타디움", sido: "대전", sigungu: "유성구", address: "구암역 인근" },
  { name: "스카이스크레이퍼 대전점", sido: "대전", sigungu: "중구", address: "중앙로역 인근" },

  // ── 세종 ──────────────────────────────────────
  // (등재 매장 없음)

  // ── 충남 ──────────────────────────────────────
  { name: "천안 플레이랩", sido: "충남", sigungu: "천안시", address: "두정역 인근" },
  { name: "천안 카드빌리지", sido: "충남", sigungu: "천안시", address: "불당동" },

  // ── 충북 ──────────────────────────────────────
  { name: "충주 듀얼존", sido: "충북", sigungu: "충주시", address: "충주 시외버스터미널 인근" },
  { name: "청주 TCG카드프리덤", sido: "충북", sigungu: "청주시", address: "산남동" },
  { name: "청주 카드슬래쉬", sido: "충북", sigungu: "청주시", address: "서원구 충북대 인근" },

  // ── 강원 ──────────────────────────────────────
  { name: "원주 카드스페이스", sido: "강원", sigungu: "원주시", address: "무실동" },

  // ── 대구 ──────────────────────────────────────
  { name: "디마트", sido: "대구", sigungu: "수성구", address: "정평역 인근" },
  { name: "대구 듀얼챔프", sido: "대구", sigungu: "동구", address: "신천역 인근" },
  { name: "대구 SS듀얼샵", sido: "대구", sigungu: "달서구", address: "월배역 인근" },
  { name: "대구 듀얼스파크", sido: "대구", sigungu: "중구", address: "동성로" },

  // ── 경북 ──────────────────────────────────────
  { name: "구미 터틀라이트", sido: "경북", sigungu: "구미시", address: "형곡동" },

  // ── 부산 ──────────────────────────────────────
  { name: "울트라레어", sido: "부산", sigungu: "부산진구", address: "서면역 인근" },
  { name: "하비카페 에이스", sido: "부산", sigungu: "동구", address: "초량동" },
  { name: "듀얼존 서면", sido: "부산", sigungu: "부산진구", address: "서면역 인근" },
  { name: "미니빌 서면점", sido: "부산", sigungu: "부산진구", address: "서면역 인근" },
  { name: "카드팜", sido: "부산", sigungu: "부산진구", address: "서면역 인근" },
  { name: "티씨지샵 셔플", sido: "부산", sigungu: "동래구", address: "동래역 인근" },
  { name: "미니빌 중앙점", sido: "부산", sigungu: "중구", address: "중앙역 인근" },
  { name: "포츈팩토리", sido: "부산", sigungu: "금정구", address: "경성대·부경대역 인근" },
  { name: "TCG 드로우", sido: "부산", sigungu: "금정구", address: "경성대·부경대역 인근" },
  { name: "다락", sido: "부산", sigungu: "금정구", address: "부산대역 인근" },
  { name: "The 樂", sido: "부산", sigungu: "연제구", address: "수영·시청 인근" },
  { name: "J클로버", sido: "부산", sigungu: "강서구", address: "명지·양정 인근" },

  // ── 울산 ──────────────────────────────────────
  { name: "울산 듀얼팩토리", sido: "울산", sigungu: "중구", address: "성남동 인근" },
  { name: "던전다이스", sido: "울산", sigungu: "남구", address: "달동사거리 인근" },
  { name: "레츠보드", sido: "울산", sigungu: "남구", address: "옥동" },

  // ── 경남 ──────────────────────────────────────
  { name: "TCG 플레이존", sido: "경남", sigungu: "김해시", address: "장유 농소로" },
  { name: "클럽앨리스 창원", sido: "경남", sigungu: "창원시", address: "성산구 반지동" },
  { name: "TCG GYM Cafe A", sido: "경남", sigungu: "창원시", address: "의창구 남산로" },
  { name: "마블 보드게임", sido: "경남", sigungu: "창원시", address: "성산구" },
  { name: "즐거운보드게임", sido: "경남", sigungu: "창원시", address: "마산합포구 월영동" },
  { name: "TCG팩토리 진주", sido: "경남", sigungu: "진주시", address: "대안동" },
  { name: "카드캐처", sido: "경남", sigungu: "양산시", address: "양산역 인근" },

  // ── 광주 ──────────────────────────────────────
  { name: "Win&Hunt", sido: "광주", sigungu: "동구", address: "금남로5가역 인근" },
  { name: "클럽 앨리스 광주", sido: "광주", sigungu: "동구", address: "문화전당역 인근" },
  { name: "화성스토어TCG", sido: "광주", sigungu: "동구", address: "충장로" },
  { name: "광주 티씨지 플레이어", sido: "광주", sigungu: "서구", address: "화운로" },

  // ── 전남 ──────────────────────────────────────
  { name: "목포 TCG팩토리", sido: "전남", sigungu: "목포시", address: "목포 시내" },

  // ── 전북 ──────────────────────────────────────
  { name: "전주 디마켓", sido: "전북", sigungu: "전주시", address: "완산구 서신동" },

  // ── 제주 ──────────────────────────────────────
  { name: "제주 TCG 아일랜드", sido: "제주", sigungu: "제주시", address: "중앙로 인근" },
];

async function main() {
  const db = supabaseAdmin();
  const { data: existing, error: exErr } = await db.from("shops").select("id, name");
  if (exErr) throw exErr;
  const byName = new Map((existing ?? []).map((s) => [s.name, s.id]));

  let inserted = 0;
  let updated = 0;
  for (const s of SHOPS) {
    const id = byName.get(s.name);
    if (id) {
      const { error } = await db
        .from("shops")
        .update({
          sido: s.sido,
          sigungu: s.sigungu,
          address: s.address,
          is_official: false,
          note: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
      updated++;
    } else {
      const { error } = await db.from("shops").insert({
        name: s.name,
        sido: s.sido,
        sigungu: s.sigungu,
        address: s.address,
        lat: null,
        lng: null,
        phone: null,
        hours: null,
        url: null,
        is_official: false,
        note: null,
      });
      if (error) throw error;
      inserted++;
    }
  }
  console.log(`완료: ${inserted}개 추가, ${updated}개 갱신 (총 ${SHOPS.length})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
