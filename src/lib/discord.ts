/** 사이트 소식 → Discord #사이트-소식 웹후크 알림. DISCORD_WEBHOOK_URL 없으면 조용히 무시(로컬/미설정 환경 대비). */
export async function notifyDiscordNews(input: { title: string; excerpt?: string | null; url: string }) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "리바지지 소식",
        embeds: [
          {
            title: input.title,
            description: input.excerpt || undefined,
            url: input.url,
            color: 0x5865f2,
          },
        ],
      }),
    });
  } catch (e) {
    console.error("Discord 웹후크 전송 실패", e);
  }
}
