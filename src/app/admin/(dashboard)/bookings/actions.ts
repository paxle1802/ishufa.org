"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { bookings, type BookingStatus } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/require-admin";

const ALLOWED: BookingStatus[] = ["confirmed", "completed", "no_show", "cancelled"];

type Result = { ok: true } | { ok: false; error: string };

/** Admin đổi trạng thái booking — scope theo shopId từ session. */
export async function setBookingStatus(
  bookingId: string,
  status: BookingStatus,
): Promise<Result> {
  try {
    const { shopId } = await requireAdmin();
    if (!ALLOWED.includes(status)) {
      return { ok: false, error: "Trạng thái không hợp lệ" };
    }

    const updated = await db
      .update(bookings)
      .set({ status })
      .where(and(eq(bookings.id, bookingId), eq(bookings.shopId, shopId)))
      .returning({ id: bookings.id });

    if (updated.length === 0) return { ok: false, error: "Không tìm thấy booking" };

    revalidatePath("/admin/bookings");
    revalidatePath("/admin");
    return { ok: true };
  } catch {
    return { ok: false, error: "Cập nhật thất bại, vui lòng thử lại." };
  }
}
