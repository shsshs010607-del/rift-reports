/**
 * .env.local 의 Supabase 3개 키를 Vercel 프로젝트 환경변수로 밀어넣는다.
 *
 *   1) npx vercel login      (브라우저에서 1회 로그인)
 *   2) node scripts/vercel-env.mjs
 *   3) npx vercel --prod     (재배포)  ← 스크립트가 물어봄
 *
 * 이미 있는 키는 지우고 다시 넣는다(update 개념). NEXT_PUBLIC_* 은 어차피
 * 공개값이라 plain, service_role 은 encrypted(secret) 로 들어간다.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";

const ENV_FILE = new URL("../.env.local", import.meta.url);
if (!existsSync(ENV_FILE)) {
  console.error(".env.local 이 없습니다.");
  process.exit(1);
}

const vars = {};
for (const line of readFileSync(ENV_FILE, "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m) vars[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const TARGETS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];
const ENVIRONMENTS = ["production", "preview", "development"];

const run = (cmd, input) =>
  execSync(cmd, { input, stdio: ["pipe", "inherit", "inherit"], shell: true });

// 프로젝트 링크 (git 리모트로 자동 추정)
if (!existsSync(new URL("../.vercel/project.json", import.meta.url))) {
  console.log("→ vercel link");
  run("npx vercel link --yes");
}

for (const key of TARGETS) {
  const val = vars[key];
  if (!val) {
    console.warn(`⚠ ${key} 없음 — 건너뜀`);
    continue;
  }
  for (const env of ENVIRONMENTS) {
    try {
      run(`npx vercel env rm ${key} ${env} --yes`);
    } catch {
      /* 없으면 무시 */
    }
    run(`npx vercel env add ${key} ${env}`, val + "\n");
    console.log(`✓ ${key} → ${env}`);
  }
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ans = await rl.question("\n지금 프로덕션 재배포할까요? (y/N) ");
rl.close();
if (ans.trim().toLowerCase() === "y") {
  run("npx vercel --prod");
} else {
  console.log("나중에: npx vercel --prod  또는 Vercel 대시보드에서 Redeploy");
}
