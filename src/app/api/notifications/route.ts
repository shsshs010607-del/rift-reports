import { NextResponse } from "next/server";
import { getNotificationFeed } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  const feed = await getNotificationFeed();
  return NextResponse.json(feed, {
    headers: { "Cache-Control": "no-store" },
  });
}
