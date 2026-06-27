import { sql } from "drizzle-orm";

import { db } from "@/lib/db";

/**
 * Tự huỷ các lịch hẹn "no-show" trên TOÀN BỘ shop trong 1 câu UPDATE:
 * còn `confirmed` (khách CHƯA được bấm "Đã đến") mà đã quá giờ hẹn + thời gian
 * ân hạn riêng của shop (shops.grace_period_min, mặc định 10') → `cancelled`,
 * mở lại khung giờ cho khách khác.
 * Lịch đã `arrived`/`completed` KHÔNG bị đụng; chủ shop có thể "Mở lại" ở Bookings.
 * Chạy định kỳ bằng Vercel Cron (/api/cron/auto-cancel) — không nằm trên đường render.
 * Trả về số lịch đã huỷ.
 */
export async function autoCancelStaleBookings(): Promise<number> {
  const result = await db.execute(sql`
    UPDATE bookings b
    SET status = 'cancelled'
    FROM shops s
    WHERE b.shop_id = s.id
      AND b.status = 'confirmed'
      AND b.start_at < now() - (s.grace_period_min * interval '1 minute')
  `);
  // neon-http trả { rowCount } cho câu lệnh ghi.
  return result.rowCount ?? 0;
}
