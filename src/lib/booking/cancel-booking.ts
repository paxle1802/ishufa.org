import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema";

/** Đã quá hạn huỷ chưa? Hạn = startAt - cutoffMin. */
export function cancelCutoffPassed(
  startAt: Date,
  cutoffMin: number,
  now: Date = new Date(),
): boolean {
  return now.getTime() > startAt.getTime() - cutoffMin * 60_000;
}

export type CancelResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "already" | "cutoff" };

/**
 * Huỷ booking theo token. Idempotent: chỉ huỷ khi đang `confirmed`.
 * Huỷ = set status=cancelled → engine tự trả slot (không xoá row).
 */
export async function cancelBookingByToken(token: string): Promise<CancelResult> {
  const booking = await db.query.bookings.findFirst({
    where: eq(bookings.cancelToken, token),
    with: { shop: { columns: { cancelCutoffMin: true } } },
  });

  if (!booking) return { ok: false, reason: "not_found" };
  if (booking.status !== "confirmed") return { ok: false, reason: "already" };
  if (cancelCutoffPassed(booking.startAt, booking.shop.cancelCutoffMin)) {
    return { ok: false, reason: "cutoff" };
  }

  const updated = await db
    .update(bookings)
    .set({ status: "cancelled" })
    .where(and(eq(bookings.cancelToken, token), eq(bookings.status, "confirmed")))
    .returning({ id: bookings.id });

  if (updated.length === 0) return { ok: false, reason: "already" };
  return { ok: true };
}
