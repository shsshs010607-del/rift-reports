/**
 * playriftbound.com 공식 대회 일정(Nexus Night 등) → tournaments + shops 반영.
 *   npx tsx scripts/seed-riftbound-schedule.ts
 *
 * 원본: https://playriftbound.com/ko-KR/events/ (GraphQL CompeteTournamentSearch,
 *       2026-09-15 기준 한국 전역 반경 500km 스냅샷 → data/playriftbound-events-2026-09.json)
 * 이 사이트엔 공식 실시간 API가 없어 스냅샷을 커밋해두고 씀. 갱신하려면 브라우저에서
 * 같은 GraphQL persisted query를 다시 떠서 파일을 교체 후 재실행.
 *
 * - 매장: 이름이 겹치는 기존 shops 행은 정확한 주소·좌표로 갱신 + is_official = true.
 *   안 겹치는 곳은 신규 삽입. (매칭은 이 파일 SHOP_MATCH 에 수동으로 고정 — 자동 유사매칭은
 *   오탐 위험이 커서 안 씀.)
 * - 대회: playriftbound tournament id 기준으로 slug 고정 → idempotent upsert.
 * env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { readFileSync } from "node:fs";
import { loadEnv, supabaseAdmin } from "./_shared";

loadEnv();

interface RbEvent {
  organizer: {
    id: string;
    name: string;
    physicalAddress: {
      adminArea1: string;
      city: string;
      formattedAddress: string;
      latitude: number;
      longitude: number;
    };
  };
  tournament: {
    id: string;
    name: string;
    config: {
      format: "CONSTRUCTED" | "LIMITED_SEALED";
      tournamentType: "NEXUS_NIGHT" | "SUMMONER_SKIRMISH";
      playerFormat: string;
      participantCapacity: number;
    };
    pricing: string;
    startsAt: string;
  };
}

const EVENTS: RbEvent[] = JSON.parse(
  readFileSync(new URL("../data/playriftbound-events-2026-09.json", import.meta.url), "utf8"),
);

const FORMAT_LABEL: Record<RbEvent["tournament"]["config"]["format"], string> = {
  CONSTRUCTED: "컨스트럭티드(발매 세트)",
  LIMITED_SEALED: "리미티드(실드)",
};
const TYPE_LABEL: Record<RbEvent["tournament"]["config"]["tournamentType"], string> = {
  NEXUS_NIGHT: "넥서스 나이트",
  SUMMONER_SKIRMISH: "소환사 스커미시",
};

/** adminArea1(시·도 전체 표기) → shops.sido 축약형. */
function toSido(adminArea1: string): string {
  const map: Record<string, string> = {
    서울특별시: "서울",
    부산광역시: "부산",
    대구광역시: "대구",
    인천광역시: "인천",
    광주광역시: "광주",
    대전광역시: "대전",
    울산광역시: "울산",
    세종특별자치시: "세종",
    경기도: "경기",
    강원특별자치도: "강원",
    충청북도: "충북",
    충청남도: "충남",
    전북특별자치도: "전북",
    전라남도: "전남",
    경상북도: "경북",
    경상남도: "경남",
    제주특별자치도: "제주",
  };
  return map[adminArea1] ?? adminArea1;
}

/**
 * organizer.id → 기존 shops.name. 여기 없는 organizer 는 신규 매장으로 삽입한다.
 * (한/영 표기가 달라 이름 문자열만으로는 자동 매칭이 못 미더워서 수동 확정.)
 */
const SHOP_MATCH: Record<string, string> = {
  "01a04b1c-76d8-7fdd-a50e-9012f2cf7a04": "원주 카드스페이스",
  "01a065bc-fd71-78dc-87b6-d928d0d70174": "건대 킨들샵",
  "01a04892-17ab-750f-9823-29d912be9354": "ABOUT TCG",
  "01a0568b-a700-7eba-af4e-c7c91deca8d9": "홍대 롤링다이스",
  "01a06303-e5bd-7ed7-89f8-ca335d40441d": "하비게임몰",
  "01a04f73-9dee-7d1e-8c66-6e0d1ae0b515": "송내 리프레시",
  "01a04b44-526c-770a-bcee-b911a1eba85e": "대전 TCG스타디움",
  "01a050e2-094e-7d5b-9773-bba28275f972": "이수 듀얼파크",
  "01a05667-ccf7-75c1-8147-29f0c846158c": "안양 트레이너스",
  "01a05705-0aef-70c4-865a-3e13e6952955": "전주 디마켓",
  "01a089a1-83f6-7d4c-8784-54b7359c0a3e": "사당 카드랩",
  "01a0567c-7617-7cb7-9011-4304f1f3197e": "일산 듀얼팩토리",
  "01a0514d-5186-7cb0-8814-30304578f925": "봉천 데쿠데쿠",
  "01a05235-3be3-7796-9bbc-dfec8165e010": "구로 카드숲",
  "01a04ba1-c48e-7579-929a-ad002f753c11": "대구 듀얼스파크",
  "01a06115-2570-7a35-b4ba-e41dc7bf7d6f": "역삼 카드냥",
  "01a05003-7051-78f8-8d91-69ec7184d263": "도곡 듀얼샵",
  "01a057fe-d03d-7f66-9031-4c829f70f90d": "평택 카드홀릭",
  "01a048d3-11d5-7e32-bbc4-673c0da5c468": "주안 티씨지아레나",
  "01a05667-1232-78ba-a3fa-ecda38a3ad5d": "인천 카드팝",
  "01a051d5-b783-724c-bc7e-8eb8041ef255": "인천 타이쿤",
  "01a084cd-563b-7336-8674-bc6737771f00": "만수 ILT듀얼존",
  "01a062fc-aa9d-7f9f-bf21-d0fa275d2f7c": "천안 카드빌리지",
  "01a04877-5ce3-755d-803d-af048b4d6df7": "평택 카드빌리지",
};

async function main() {
  const db = supabaseAdmin();

  const organizers = new Map<string, RbEvent["organizer"]>();
  for (const e of EVENTS) organizers.set(e.organizer.id, e.organizer);

  // ── 1. 매장 갱신/삽입 ────────────────────────────────────────
  const shopIdByOrganizerId = new Map<string, string>();
  for (const org of organizers.values()) {
    const addr = org.physicalAddress;
    const matchName = SHOP_MATCH[org.id];

    if (matchName) {
      const { data: existing, error: findErr } = await db
        .from("shops")
        .select("id")
        .eq("name", matchName)
        .maybeSingle();
      if (findErr) throw findErr;
      if (!existing) throw new Error(`SHOP_MATCH 오류 — "${matchName}" 매장을 shops 테이블에서 못 찾음`);

      const { error } = await db
        .from("shops")
        .update({
          address: addr.formattedAddress,
          lat: addr.latitude,
          lng: addr.longitude,
          is_official: true,
        })
        .eq("id", existing.id);
      if (error) throw error;
      shopIdByOrganizerId.set(org.id, existing.id);
      console.log("매장 갱신:", matchName);
    } else {
      const { data: existingByName, error: findErr } = await db
        .from("shops")
        .select("id")
        .eq("name", org.name)
        .maybeSingle();
      if (findErr) throw findErr;

      if (existingByName) {
        const { error } = await db
          .from("shops")
          .update({
            address: addr.formattedAddress,
            lat: addr.latitude,
            lng: addr.longitude,
            is_official: true,
          })
          .eq("id", existingByName.id);
        if (error) throw error;
        shopIdByOrganizerId.set(org.id, existingByName.id);
        console.log("매장 갱신(신규매칭):", org.name);
      } else {
        const { data: inserted, error } = await db
          .from("shops")
          .insert({
            name: org.name,
            sido: toSido(addr.adminArea1),
            sigungu: addr.city,
            address: addr.formattedAddress,
            lat: addr.latitude,
            lng: addr.longitude,
            phone: null,
            hours: null,
            url: null,
            is_official: true,
            note: "playriftbound.com 등록 매장 (자동 반영)",
          })
          .select("id")
          .single();
        if (error) throw error;
        shopIdByOrganizerId.set(org.id, inserted.id);
        console.log("매장 신규:", org.name);
      }
    }
  }

  // ── 2. 대회 갱신/삽입 ────────────────────────────────────────
  for (const e of EVENTS) {
    const { tournament: t, organizer: org } = e;
    const slug = `rb-${t.id}`;
    const format = `${TYPE_LABEL[t.config.tournamentType]} · ${FORMAT_LABEL[t.config.format]} · 1v1 · 정원 ${t.config.participantCapacity}명`;
    const description = `playriftbound.com 공식 등록 대회. ${org.name}에서 진행하는 무료 참가 ${TYPE_LABEL[t.config.tournamentType]}입니다. 참가 신청은 아래 등록 링크에서 진행하세요.`;

    const row = {
      slug,
      name: t.name,
      description,
      format,
      status: "upcoming" as const,
      category: "shop" as const,
      starts_at: t.startsAt,
      ends_at: null,
      location: `${org.name} (${toSido(org.physicalAddress.adminArea1)} ${org.physicalAddress.city})`,
      is_online: false,
      organizer: org.name,
      registration_url: `https://playriftbound.com/ko-KR/events/${t.id}`,
      prize_pool: null,
      banner_url: null,
    };

    const { data: existing, error: findErr } = await db
      .from("tournaments")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (findErr) throw findErr;

    if (existing) {
      const { error } = await db.from("tournaments").update(row).eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await db.from("tournaments").insert(row);
      if (error) throw error;
    }
  }

  console.log(`완료 — 매장 ${organizers.size}곳, 대회 ${EVENTS.length}건`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
