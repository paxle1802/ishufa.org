import { fromZonedTime } from "date-fns-tz";
import { and, asc, count, eq, gte, lt, ne, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { bookings, promotions } from "@/lib/db/schema";
import { APP_TIME_ZONE } from "@/lib/tz";

const MS_PER_DAY = 86_400_000;

/**
 * Đơn "Đang làm" (arrived) còn sót từ NGÀY ĐÃ QUA — chủ shop quên bấm Tính tiền.
 * Dùng để nhắc đóng đơn cuối ngày (không tự đóng vì đụng tới tiền).
 */
export async function listOverdueArrived(shopId: string, todayStart: Date) {
  return db
    .select({
      id: bookings.id,
      customerName: bookings.customerName,
      startAt: bookings.startAt,
      totalPrice: bookings.totalPrice,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.shopId, shopId),
        eq(bookings.status, "arrived"),
        lt(bookings.startAt, todayStart),
      ),
    )
    .orderBy(asc(bookings.startAt));
}

export interface TodayStats {
  revenue: number; // tổng net các booking hoàn tất hôm nay
  bookingsToday: number; // số lịch chưa huỷ trong ngày
  activePromos: number;
}

/** Thống kê nhanh cho dashboard, theo ngày địa phương (Asia/Saigon). */
export async function getTodayStats(shopId: string, day: string): Promise<TodayStats> {
  const dayStart = fromZonedTime(`${day}T00:00:00`, APP_TIME_ZONE);
  const dayEnd = new Date(dayStart.getTime() + MS_PER_DAY);

  const [rev] = await db
    .select({
      revenue: sql<number>`COALESCE(SUM(${bookings.totalPrice}), 0)`.mapWith(Number),
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.shopId, shopId),
        eq(bookings.status, "completed"),
        gte(bookings.startAt, dayStart),
        lt(bookings.startAt, dayEnd),
      ),
    );

  const [cnt] = await db
    .select({ total: count() })
    .from(bookings)
    .where(
      and(
        eq(bookings.shopId, shopId),
        ne(bookings.status, "cancelled"),
        gte(bookings.startAt, dayStart),
        lt(bookings.startAt, dayEnd),
      ),
    );

  const [promo] = await db
    .select({ active: count() })
    .from(promotions)
    .where(and(eq(promotions.shopId, shopId), eq(promotions.active, true)));

  return {
    revenue: rev?.revenue ?? 0,
    bookingsToday: cnt?.total ?? 0,
    activePromos: promo?.active ?? 0,
  };
}
