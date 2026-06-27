import { NextResponse } from "next/server";

import { autoCancelStaleBookings } from "@/lib/booking/auto-cancel";
import { env } from "@/lib/env";

// Cron không cache; luôn chạy mới.
export const dynamic = "force-dynamic";

/**
 * Quét tự-huỷ no-show toàn bộ shop. Gọi bởi Vercel Cron (xem vercel.json).
 * Vercel tự đính kèm `Authorization: Bearer <CRON_SECRET>` khi env CRON_SECRET tồn tại.
 */
export async function GET(req: Request) {
  const secret = env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const cancelled = await autoCancelStaleBookings();
    return NextResponse.json({ ok: true, cancelled });
  } catch (err) {
    console.error("[cron/auto-cancel]", err);
    return NextResponse.json({ ok: false, error: "Sweep failed" }, { status: 500 });
  }
}
