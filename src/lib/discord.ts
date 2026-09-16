/**
 * 사이트 소식 → Discord 웹후크 알림. DISCORD_WEBHOOK_URL 없으면 조용히 무시(로컬/미설정 환경 대비).
 * 여러 채널에 동시에 보내려면 DISCORD_WEBHOOK_URL 에 쉼표로 구분해 여러 개 넣으면 된다.
 */
export async function notifyDiscordNews(input: { title: string; excerpt?: string | null; url: string }) {
  const webhookUrls = (process.env.DISCORD_WEBHOOK_URL ?? "")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
  if (webhookUrls.length === 0) return;

  const payload = JSON.stringify({
    username: "리바지지 소식",
    embeds: [
      {
        title: input.title,
        description: input.excerpt || undefined,
        url: input.url,
        color: 0x5865f2,
      },
    ],
  });

  await Promise.all(
    webhookUrls.map((webhookUrl) =>
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      }).catch((e) => console.error("Discord 웹후크 전송 실패", e)),
    ),
  );
}
