import { and, eq, sql } from "drizzle-orm";

import { pooledDb } from "@/lib/db/pooled";
import { customers, loyaltyLedger } from "@/lib/db/schema";

type Result = { ok: true } | { ok: false; error: string };

/**
 * Đổi điểm tại quầy: trừ điểm khỏi balance + ghi ledger `redeem`.
 * Tiền/giảm giá xử lý vật lý ở quầy — hệ thống chỉ trừ điểm.
 */
export async function redeemPoints(
  shopId: string,
  customerId: string,
  points: number,
  note: string | null,
): Promise<Result> {
  if (points <= 0) return { ok: false, error: "Số điểm không hợp lệ" };

  return pooledDb.transaction(async (tx) => {
    const [c] = await tx
      .select({ balance: customers.loyaltyPoints })
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.shopId, shopId)))
      .for("update");

    if (!c) return { ok: false, error: "Không tìm thấy khách hàng" };
    if (points > c.balance) return { ok: false, error: "Không đủ điểm" };

    await tx
      .update(customers)
      .set({ loyaltyPoints: sql`${customers.loyaltyPoints} - ${points}` })
      .where(eq(customers.id, customerId));
    await tx.insert(loyaltyLedger).values({
      shopId,
      customerId,
      type: "redeem",
      points: -points,
      note,
    });
    return { ok: true };
  });
}
