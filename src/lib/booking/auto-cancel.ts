import { and, eq, lt } from "drizzle-orm";

import { db } from "@/lib/db";
import { bookings, shops } from "@/lib/db/schema";

/**
 * Tự huỷ các lịch hẹn "no-show": còn `confirmed` (khách CHƯA được bấm "Đã đến")
 * mà đã quá giờ hẹn + thời gian ân hạn (shops.gracePeriodMin, mặc định 10').
 * → chuyển sang `cancelled` để mở lại khung giờ cho khách khác.
 * Lịch đã `arrived`/`completed` KHÔNG bị đụng tới; chủ shop có thể "Mở lại" ở Bookings.
 * Gọi cơ hội (lazy) khi tải danh sách booking / tính slot — không cần cron.
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
