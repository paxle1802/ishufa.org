import { and, eq, gte, lt } from "drizzle-orm";
import { fromZonedTime } from "date-fns-tz";
import { db } from "@/lib/db";
import { bookings, closures, workingHours } from "@/lib/db/schema";
import { APP_TIME_ZONE } from "@/lib/tz";
import { computeSlots } from "./compute-slots";
import type { Shop } from "@/lib/db/schema";

const MS_PER_DAY = 86_400_000;

/** Weekday 0=CN..6=T7 của 1 ngày "yyyy-MM-dd" (theo lịch, độc lập tz). */
function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/**
 * Lấy slot khả dụng thực tế: đọc working_hours + closures + bookings confirmed
 * của ngày (scope shopId) rồi gọi computeSlots.
 */
export async function getAvailability(params: {
  shop: Pick<
    Shop,
    | "id"
    | "slotIntervalMin"
    | "capacity"
    | "minLeadMin"
    | "maxAdvanceDays"
  >;
  date: string; // "yyyy-MM-dd" địa phương
  totalDurationMin: number;
  now?: Date;
}): Promise<Date[]> {
  const { shop, date, totalDurationMin } = params;
  const now = params.now ?? new Date();

  const dayStart = fromZonedTime(`${date}T00:00:00`, APP_TIME_ZONE);
  const dayEnd = new Date(dayStart.getTime() + MS_PER_DAY);
  const weekday = weekdayOf(date);

  const [hours, closedRows, dayBookings] = await Promise.all([
    db
      .select()
      .from(workingHours)
      .where(
        and(
          eq(workingHours.shopId, shop.id),
          eq(workingHours.weekday, weekday),
        ),
      ),
    db
      .select()
      .from(closures)
      .where(and(eq(closures.shopId, shop.id), eq(closures.date, date))),
    db
      .select({ startAt: bookings.startAt, endAt: bookings.endAt })
      .from(bookings)
      .where(
        and(
          eq(bookings.shopId, shop.id),
          eq(bookings.status, "confirmed"),
          gte(bookings.startAt, dayStart),
          lt(bookings.startAt, dayEnd),
        ),
      ),
  ]);

  return computeSlots({
    date,
    now,
    workingIntervals: hours.map((h) => ({
      // time cột trả "HH:mm:ss" → cắt còn "HH:mm"
      open: h.openTime.slice(0, 5),
      close: h.closeTime.slice(0, 5),
    })),
    isClosed: closedRows.length > 0,
    totalDurationMin,
    slotIntervalMin: shop.slotIntervalMin,
    capacity: shop.capacity,
    bookings: dayBookings,
    minLeadMin: shop.minLeadMin,
    maxAdvanceDays: shop.maxAdvanceDays,
  });
}
