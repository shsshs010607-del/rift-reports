/**
 * 리프트 리포트(메타 리포트) 글을 커뮤니티 report 게시판에 발행/갱신한다.
 *   npx tsx scripts/post-rift-report.ts
 *
 * - 같은 제목이 있으면 본문만 갱신 (idempotent).
 * - is_notice + is_pinned 로 게시판 상단에 색다르게 노출.
 * env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { loadEnv, supabaseAdmin } from "./_shared";

loadEnv();

const ADMIN_EMAIL = "shsshs010607@gmail.com";

const TITLE = "리프트 리포트 #1 — 분노(Fury)";

const BODY = `> **리프트 리포트**는 리바지지가 한 도메인·아키타입을 깊게 파고드는 정기 코너입니다. 1편의 주인공은 6색 중 가장 공격적인 색, **분노(Fury)**.
> 기준: OGN(오리진스) + OGS(프루빙 그라운드) · 한국 스탠다드 · 정식 한글명은 라이엇 공식 발표 후 반영

## 분노란

분노는 리프트바운드 6개 도메인 중 **가장 빠르고 직접적인** 색입니다. 상징색은 빨강, 정체성은 한 문장으로:

> 상대 유닛과 넥서스에 **피해를 직접 꽂고**, 공격할 때 **더 세지는** 유닛으로 밀어붙여 게임을 짧게 끝낸다.

침착이 장기전을, 지혜가 카드 이득을 노린다면 분노는 **시간을 안 준다**는 컨셉입니다.

## 핵심 키워드 3가지

### 1. 직접 피해 ("번")
유닛 전투를 거치지 않고 피해를 주는 주문이 분노의 정수입니다.

[[소각]]
[[유성]]

- **소각** (2코) — 전장 유닛에 2피해. 값싼 제거·마무리.
- **유성** (2코) — 3피해 2번. 유닛 두 마리 정리 or 한 마리에 6.
- **이케시아 폭우** (7코, 카이사) — 2피해를 6번. 광역 학살.
- **초강력 초토화 로켓!** (4코, 징크스) — 5피해 + 정복 시 손으로 회수.

### 2. [맹공] (Attack)
공격자일 때 위력이 오르는 키워드. "선공이 곧 이득"이 되게 만듭니다.

[[켐테크 집행자]]

- **켐테크 집행자** (2코 2/2) — 공격 시 4/2. 대신 사용할 때 카드 1장 버림.
- **파론 대위** (4코) — 이곳의 다른 아군 유닛 전부에게 [맹공] 부여.
- **불멸의 불사조** — 주문으로 유닛을 처치하면 폐기장에서 재사용.

### 3. [가속] (Accelerate)
분노 룬을 추가로 지불하면 유닛이 **탈진 없이(준비 상태로)** 등장 → 나오자마자 공격/방어.

[[군단 후위병]]

- **군단 후위병** (2코 2/2) — 분노 룬 내면 즉시 공격 가능.
- **카이사 - 생존자** (4코 4/4) — 가속 + 정복 시 드로우.

## 분노 달린 레전드 (OGN·OGS)

분노 레전드는 **전부 2색**입니다. 순수 분노 단색 레전드는 아직 없어서, 분노는 항상 파트너 색과 함께 갑니다.

### 카이사 - 공허의 딸 — 분노 + 지혜
[[카이사 - 공허의 딸]]
> 탈진: [반응] 무지개 룬 추가 (주문 전용)

주문 중심 분노. 번 주문을 잔뜩 넣고 카이사로 자원을 뻥튀기해 한 턴에 여러 발을 쏩니다. **이케시아 폭우** 같은 고코스트 주문의 파트너.

### 볼리베어 - 무자비한 폭풍 — 분노 + 육체
[[볼리베어 - 무자비한 폭풍]]
> [위력적] 유닛(위력 5+)을 내면 룬 1개 탈진 전개

큰 유닛으로 램프하며 짓누르는 미드레인지. [[볼리베어 - 격노한]] (10코 9/9, 굴절2) 같은 위력적 유닛과 궁합.

### 징크스 - 난폭한 말괄량이 — 분노 + 혼돈
[[징크스 - 난폭한 말괄량이]]
> 손패 1장 이하면 개시 단계에 1장 드로우

손을 비우며 몰아치는 순수 어그로. 손패 소진이 곧 이득이 되는 구조라, 값싼 카드를 빠르게 쏟아붓습니다.

### 다리우스 - 녹서스의 실력자 — 분노 + 질서
[[다리우스 - 녹서스의 실력자]]
> [군단] 조건에서 탈진으로 에너지 추가

군단(이번 턴에 카드 사용) 시너지로 자원을 굴리는 미드레인지. **녹서스의 단두대** 등 녹서스 카드와 함께.

### 애니 - 어둠의 아이 — 분노 + 혼돈 (스타터)
[[애니 - 어둠의 아이]]
> 턴 종료 시 룬 최대 2장 준비

OGS 프루빙 그라운드 스타터 레전드. 룬 회복으로 매 턴 자원을 꽉 채워 주문을 연사하는 입문용 분노.

## 더 볼만한 분노 카드

- **주문** — [[신난다!]] · [[쪼개기]] · [[갈취]] · [[맹목의 분노]] · [[격노한 선동가]] · [[폭풍을 부르는 자]]
- **유닛** — [[녹서스 방해 공작원]] · [[마그마 웜]] · [[바이 - 파괴자]]
- **도구** — [[강철 쇠뇌]] · [[분노의 봉인]]
- **룬** — [[분노의 룬]]

## 분노를 쓴다면

| | |
|---|---|
| **잘 맞는 성향** | 상대 계획이 완성되기 전에 짧게 끝낸다 |
| **약점** | 장기전 · 넥서스 회복 · 광역 제거 |
| **추천 파트너** | 지혜(주문) · 혼돈(어그로) · 육체(큰 유닛) |

---
👉 [분노 카드 전체 보기](/cards?domain=fury) · [메타 덱 보기](/decks)

*리프트 리포트 #1 · 리바지지 · 한국 스탠다드(OGN·OGS) 기준. 잘못된 내용은 댓글로 알려주세요.*`;

async function main() {
  const db = supabaseAdmin();
  const { data: users } = await db.auth.admin.listUsers({ perPage: 200 });
  const admin = users.users.find((u) => u.email === ADMIN_EMAIL);
  if (!admin) throw new Error(`관리자(${ADMIN_EMAIL}) 계정을 찾지 못했습니다.`);

  const { data: existing } = await db
    .from("posts")
    .select("id")
    .eq("category", "report")
    .eq("title", TITLE)
    .maybeSingle();

  if (existing) {
    const { error } = await db
      .from("posts")
      .update({ body: BODY, is_notice: true, is_pinned: true, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw error;
    console.log(`갱신: ${TITLE} → ${existing.id}`);
    return;
  }

  const { data, error } = await db
    .from("posts")
    .insert({
      category: "report",
      title: TITLE,
      body: BODY,
      author_id: admin.id,
      is_notice: true,
      is_pinned: true,
    })
    .select("id")
    .single();
  if (error) throw error;
  console.log(`발행: ${TITLE} → ${data.id}`);
  console.log(`https://rift-reports.vercel.app/community/post/${data.id}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
