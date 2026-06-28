"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { applyCustomerAggregate } from "@/lib/customers/apply-customer-aggregate";
import { pooledDb } from "@/lib/db/pooled";
import { bookings, shops, type BookingStatus } from "@/lib/db/schema";
import { accruePoints, reversePoints } from "@/lib/loyalty/accrue-points";
import {
  consumePackage,
  refundPackage,
} from "@/lib/packages/consume-package";

const ALLOWED: BookingStatus[] = [
  "confirmed",
  "arrived",
  "completed",
  "cancelled",
];

type Result = { ok: true; warning?: string } | { ok: false; error: string };

/**
 * Đổi trạng thái booking trong 1 transaction (chokepoint của toàn hệ).
 * Idempotent qua cổng so sánh status. Khi chuyển sang/khỏi `completed`:
 *  - cộng/giảm tổng chi + lượt ghé của khách (CRM)
 *  - cộng/hoàn điểm tích luỹ
 *  - trừ/hoàn buổi gói combo (nếu admin chọn / booking đã gắn gói)
 */
export async function setBookingStatus(
  bookingId: string,
  status: BookingStatus,
  opts?: { customerPackageId?: string },
): Promise<Result> {
  try {
    const { shopId } = await requireAdmin();
    if (!ALLOWED.includes(status)) {
      return { ok: false, error: "Trạng thái không hợp lệ" };
    }

    const result = await pooledDb.transaction(async (tx): Promise<Result> => {
      const [b] = await tx
        .select({
          id: bookings.id,
          status: bookings.status,
          totalPrice: bookings.totalPrice,
          customerName: bookings.customerName,
          customerPhone: bookings.customerPhone,
          startAt: bookings.startAt,
          customerPackageId: bookings.customerPackageId,
        })
        .from(bookings)
        .where(and(eq(bookings.id, bookingId), eq(bookings.shopId, shopId)))
        .for("update");

      if (!b) return { ok: false, error: "Không tìm thấy booking" };

      const prev = b.status;
      if (prev === status) return { ok: true }; // no-op → idempotent

      await tx.update(bookings).set({ status }).where(eq(bookings.id, b.id));

      const delta = status === "completed" ? 1 : prev === "completed" ? -1 : 0;
      let warning: string | undefined;

      if (delta === 1) {
        const customerId = await applyCustomerAggregate(
          tx, shopId, b.customerPhone, b.customerName, b.totalPrice, b.startAt, 1,
        );
        const [shop] = await tx
          .select({ earnRate: shops.loyaltyEarnRate })
          .from(shops)
          .where(eq(shops.id, shopId));
        if (customerId && shop) {
          await accruePoints(tx, shopId, shop.earnRate, customerId, b.id, b.totalPrice);
        }
        if (opts?.customerPackageId) {
          const r = await consumePackage(tx, shopId, opts.customerPackageId, b.totalPrice);
          if (r.consumed) {
            await tx
              .update(bookings)
              .set({ customerPackageId: opts.customerPackageId })
              .where(eq(bookings.id, b.id));
          } else {
            warning = r.warning;
          }
        }
      } else if (delta === -1) {
        const customerId = await applyCustomerAggregate(
          tx, shopId, b.customerPhone, b.customerName, b.totalPrice, b.startAt, -1,
        );
        if (customerId) await reversePoints(tx, shopId, customerId, b.id);
        if (b.customerPackageId) {
          await refundPackage(tx, b.customerPackageId, b.totalPrice);
          await tx
            .update(bookings)
            .set({ customerPackageId: null })
            .where(eq(bookings.id, b.id));
        }
      }

      return { ok: true, warning };
    });

    if (result.ok) {
      revalidatePath("/admin/bookings");
      revalidatePath("/admin");
      revalidatePath("/admin/customers");
    }
    return result;
  } catch {
    return { ok: false, error: "Cập nhật thất bại, vui lòng thử lại." };
  }
}
