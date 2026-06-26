import { sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { rateLimits } from "@/lib/db/schema";

/**
 * Rate-limit fixed-window dựa trên Postgres (bảng rate_limits).
 * Tăng count theo (key, windowStart) bằng upsert nguyên tử.
 * @returns true nếu CÒN trong hạn, false nếu ĐÃ VƯỢT.
 */
export async function checkRateLimit(
  key: string,
  windowMs: number,
  max: number,
): Promise<boolean> {
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);

  const [row] = await db
    .insert(rateLimits)
    .values({ key, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimits.key, rateLimits.windowStart],
      set: { count: sql`${rateLimits.count} + 1` },
    })
    .returning({ count: rateLimits.count });

  return (row?.count ?? 1) <= max;
}
