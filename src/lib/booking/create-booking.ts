import { and, eq, gt, lt, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import { pooledDb } from "@/lib/db/pooled";
import { bookingItems, bookings } from "@/lib/db/schema";

/** Lỗi khi slot vừa hết chỗ (đặt trùng) — phân biệt với lỗi hệ thống. */
export class SlotUnavailableError extends Error {
  constructor(message = "Slot vừa hết chỗ, vui lòng chọn giờ khác.") {
    super(message);
    this.name = "SlotUnavailableError";
  }
}

export interface CreateBookingParams {
  shopId: string;
  capacity: number;
  startAt: Date;
  endAt: Date;
  totalDurationMin: number;
  totalPrice: number;
  customerName: string;
  customerPhone: string;
  note: string | null;
  items: { serviceId: string; priceSnapshot: number; durationSnapshot: number }[];
}

/**
 * Tạo booking trong 1 transaction CHỐNG ĐẶT TRÙNG:
 * 1. advisory xact lock theo shop → mọi request cùng shop tuần tự hoá.
 * 2. đếm booking confirmed GIAO [startAt,endAt). Nếu >= capacity → reject.
 * 3. insert booking + items (snapshot giá/duration) + cancel_token.
 * Khoá ở mức shop (không phải slot) đủ cho quy mô MVP và đảm bảo đúng.
 */
export async function createBooking(
  p: CreateBookingParams,
): Promise<{ id: string; cancelToken: string }> {
  return pooledDb.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${p.shopId})::bigint)`);

    const overlapping = await tx
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.shopId, p.shopId),
          eq(bookings.status, "confirmed"),
          lt(bookings.startAt, p.endAt),
          gt(bookings.endAt, p.startAt),
        ),
      );

    if (overlapping.length >= p.capacity) {
      throw new SlotUnavailableError();
    }

    const cancelToken = nanoid(24);
    const [booking] = await tx
      .insert(bookings)
      .values({
        shopId: p.shopId,
        customerName: p.customerName,
        customerPhone: p.customerPhone,
        note: p.note,
        startAt: p.startAt,
        endAt: p.endAt,
        totalDurationMin: p.totalDurationMin,
        totalPrice: p.totalPrice,
        status: "confirmed",
        cancelToken,
      })
      .returning({ id: bookings.id });

    if (p.items.length > 0) {
      await tx.insert(bookingItems).values(
        p.items.map((it) => ({ ...it, bookingId: booking.id })),
      );
    }

    return { id: booking.id, cancelToken };
  });
}
