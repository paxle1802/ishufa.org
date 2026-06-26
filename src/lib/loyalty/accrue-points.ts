import { and, eq, sql } from "drizzle-orm";

import type { Tx } from "@/lib/db/pooled";
import { customers, loyaltyLedger } from "@/lib/db/schema";

/**
 * Cộng điểm khi booking hoàn tất: floor(net/1000) * earnRate.
 * Ghi 1 dòng ledger `earn` + cộng dồn balance (cùng transaction).
 */
export async function accruePoints(
  tx: Tx,
  shopId: string,
  earnRate: number,
  customerId: string,
  bookingId: string,
  netTotal: number,
): Promise<void> {
  if (earnRate <= 0) return;
  const pts = Math.floor(netTotal / 1000) * earnRate;
  if (pts <= 0) return;

  await tx
    .update(customers)
    .set({ loyaltyPoints: sql`${customers.loyaltyPoints} + ${pts}` })
    .where(eq(customers.id, customerId));
  await tx.insert(loyaltyLedger).values({
    shopId,
    customerId,
    bookingId,
    type: "earn",
    points: pts,
  });
}

/**
 * Hoàn điểm khi đảo trạng thái khỏi `completed`.
 * Chỉ hoàn nếu có dòng `earn` cho booking và CHƯA bị `reverse`.
 */
export async function reversePoints(
  tx: Tx,
  shopId: string,
  customerId: string,
  bookingId: string,
): Promise<void> {
  const [earn] = await tx
    .select({ points: loyaltyLedger.points })
    .from(loyaltyLedger)
    .where(
      and(
        eq(loyaltyLedger.bookingId, bookingId),
        eq(loyaltyLedger.type, "earn"),
      ),
    );
  if (!earn) return;

  const [reversed] = await tx
    .select({ id: loyaltyLedger.id })
    .from(loyaltyLedger)
    .where(
      and(
        eq(loyaltyLedger.bookingId, bookingId),
        eq(loyaltyLedger.type, "reverse"),
      ),
    );
  if (reversed) return; // đã hoàn trước đó

  await tx
    .update(customers)
    .set({
      loyaltyPoints: sql`GREATEST(0, ${customers.loyaltyPoints} - ${earn.points})`,
    })
    .where(eq(customers.id, customerId));
  await tx.insert(loyaltyLedger).values({
    shopId,
    customerId,
    bookingId,
    type: "reverse",
    points: -earn.points,
  });
}
