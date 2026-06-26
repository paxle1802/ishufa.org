import { fromZonedTime } from "date-fns-tz";
import { and, asc, eq, gte, lt } from "drizzle-orm";

import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import { APP_TIME_ZONE } from "@/lib/tz";

const MS_PER_DAY = 86_400_000;

/** Booking 1 ngày (giờ địa phương) của shop, kèm dịch vụ. Mọi status. */
export function listBookingsForDay(shopId: string, date: string) {
  const dayStart = fromZonedTime(`${date}T00:00:00`, APP_TIME_ZONE);
  const dayEnd = new Date(dayStart.getTime() + MS_PER_DAY);

  return db.query.bookings.findMany({
    where: and(
      eq(bookings.shopId, shopId),
      gte(bookings.startAt, dayStart),
      lt(bookings.startAt, dayEnd),
    ),
    orderBy: asc(bookings.startAt),
    with: {
      items: { with: { service: { columns: { name: true } } } },
    },
  });
}

/** Booking theo cancel_token (cho trang huỷ của khách), kèm shop + dịch vụ. */
export function getBookingByToken(token: string) {
  return db.query.bookings.findFirst({
    where: eq(bookings.cancelToken, token),
    with: {
      shop: {
        columns: { name: true, address: true, contactPhone: true, cancelCutoffMin: true },
      },
      items: { with: { service: { columns: { name: true } } } },
    },
  });
}

export type BookingForDay = Awaited<ReturnType<typeof listBookingsForDay>>[number];
export type BookingWithShop = NonNullable<Awaited<ReturnType<typeof getBookingByToken>>>;
