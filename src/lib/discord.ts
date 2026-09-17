function parseWebhookUrls(envVar: string | undefined): string[] {
  return (envVar ?? "")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
}

async function sendDiscordEmbed(
  webhookUrls: string[],
  input: { title: string; excerpt?: string | null; url: string },
) {
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

/**
 * 사이트 소식(리포트 발행) → #사이트-소식 채널. DISCORD_WEBHOOK_URL 없으면 조용히 무시.
 * 여러 채널에 동시에 보내려면 DISCORD_WEBHOOK_URL 에 쉼표로 구분해 여러 개 넣으면 된다.
 */
export async function notifyDiscordNews(input: { title: string; excerpt?: string | null; url: string }) {
  await sendDiscordEmbed(parseWebhookUrls(process.env.DISCORD_WEBHOOK_URL), input);
}

/**
 * 매장 정보(tournament) 게시글 → #매장-소식 채널 전용 웹훅. DISCORD_WEBHOOK_URL_STORE 없으면 조용히 무시.
 * #사이트-소식과 별도 채널이라 DISCORD_WEBHOOK_URL 과 분리해서 관리한다.
 */
export async function notifyDiscordStoreNews(input: { title: string; excerpt?: string | null; url: string }) {
  await sendDiscordEmbed(parseWebhookUrls(process.env.DISCORD_WEBHOOK_URL_STORE), input);
}
