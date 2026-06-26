import { and, eq, sql } from "drizzle-orm";

import type { Tx } from "@/lib/db/pooled";
import { customers } from "@/lib/db/schema";
import { normalizePhone } from "@/lib/validation/booking";

/**
 * Cập nhật bản ghi khách hàng (gom theo shopId + phone) khi booking đổi trạng thái.
 * delta = +1 (vừa hoàn tất) hoặc -1 (đảo từ hoàn tất về khác).
 * Idempotency do caller (setBookingStatus) đảm bảo qua cổng so sánh status.
 * Trả customerId để bước tích điểm dùng tiếp (null nếu decrement mà chưa có khách).
 */
export async function applyCustomerAggregate(
  tx: Tx,
  shopId: string,
  rawPhone: string,
  name: string,
  amount: number,
  visitAt: Date,
  delta: 1 | -1,
): Promise<string | null> {
  const phone = normalizePhone(rawPhone);

  if (delta === 1) {
    const [row] = await tx
      .insert(customers)
      .values({
        shopId,
        name,
        phone,
        visitCount: 1,
        totalSpent: amount,
        lastVisitAt: visitAt,
      })
      .onConflictDoUpdate({
        target: [customers.shopId, customers.phone],
        set: {
          name,
          visitCount: sql`${customers.visitCount} + 1`,
          totalSpent: sql`${customers.totalSpent} + ${amount}`,
          lastVisitAt: visitAt,
        },
      })
      .returning({ id: customers.id });
    return row?.id ?? null;
  }

  // delta === -1: giảm, sàn 0. Không tạo mới.
  const [row] = await tx
    .update(customers)
    .set({
      visitCount: sql`GREATEST(0, ${customers.visitCount} - 1)`,
      totalSpent: sql`GREATEST(0, ${customers.totalSpent} - ${amount})`,
    })
    .where(and(eq(customers.shopId, shopId), eq(customers.phone, phone)))
    .returning({ id: customers.id });
  return row?.id ?? null;
}
