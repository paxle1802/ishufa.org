import { and, eq, lt } from "drizzle-orm";

import { db } from "@/lib/db";
import { bookings, shops } from "@/lib/db/schema";

/**
 * Tự huỷ no-show của 1 shop: lịch còn `confirmed` (chưa bấm "Đã đến") mà đã quá
 * giờ hẹn + thời gian ân hạn (shops.grace_period_min, mặc định 10') → `cancelled`,
 * mở lại khung giờ cho khách khác. `arrived`/`completed` KHÔNG bị đụng.
 * Gọi cơ hội (lazy) khi xem Bookings / khách tải khung giờ — không cần cron.
 */
export async function autoCancelStaleBookings(shopId: string): Promise<void> {
  const [shop] = await db
    .select({ grace: shops.gracePeriodMin })
    .from(shops)
    .where(eq(shops.id, shopId));
  if (!shop) return;

  const cutoff = new Date(Date.now() - shop.grace * 60_000);

  await db
    .update(bookings)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(bookings.shopId, shopId),
        eq(bookings.status, "confirmed"),
        lt(bookings.startAt, cutoff),
      ),
    );
}
