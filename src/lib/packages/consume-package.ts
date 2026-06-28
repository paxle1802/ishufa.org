import { and, eq, sql } from "drizzle-orm";

import type { Tx } from "@/lib/db/pooled";
import { customerPackages } from "@/lib/db/schema";

export interface ConsumeResult {
  consumed: boolean;
  warning?: string;
}

/**
 * Trừ gói khi booking hoàn tất:
 *  - combo   → trừ 1 buổi.
 *  - prepaid → trừ `amount` (tổng tiền dịch vụ) khỏi số dư (sàn 0).
 * Không chặn hoàn tất: hết buổi / hết số dư / hết hạn → bỏ qua + trả cảnh báo.
 */
export async function consumePackage(
  tx: Tx,
  shopId: string,
  customerPackageId: string,
  amount: number,
  now: Date = new Date(),
): Promise<ConsumeResult> {
  const [cp] = await tx
    .select({
      id: customerPackages.id,
      kind: customerPackages.kind,
      sessionsRemaining: customerPackages.sessionsRemaining,
      balanceRemaining: customerPackages.balanceRemaining,
      expiresAt: customerPackages.expiresAt,
    })
    .from(customerPackages)
    .where(
      and(
        eq(customerPackages.id, customerPackageId),
        eq(customerPackages.shopId, shopId),
      ),
    )
    .for("update");

  if (!cp) return { consumed: false, warning: "Không tìm thấy gói." };
  if (cp.expiresAt.getTime() < now.getTime()) {
    return { consumed: false, warning: "Gói đã hết hạn." };
  }

  if (cp.kind === "prepaid") {
    if (cp.balanceRemaining <= 0) {
      return { consumed: false, warning: "Gói nạp tiền đã hết số dư." };
    }
    const deducted = Math.min(cp.balanceRemaining, amount);
    await tx
      .update(customerPackages)
      .set({ balanceRemaining: sql`${customerPackages.balanceRemaining} - ${deducted}` })
      .where(eq(customerPackages.id, cp.id));
    const warning =
      deducted < amount ? "Số dư không đủ — đã trừ hết số dư còn lại." : undefined;
    return { consumed: true, warning };
  }

  // combo
  if (cp.sessionsRemaining <= 0) return { consumed: false, warning: "Gói đã hết buổi." };
  await tx
    .update(customerPackages)
    .set({ sessionsRemaining: sql`${customerPackages.sessionsRemaining} - 1` })
    .where(eq(customerPackages.id, cp.id));
  return { consumed: true };
}

/**
 * Hoàn lại khi đảo trạng thái khỏi `completed`:
 *  - combo   → +1 buổi (không vượt tổng).
 *  - prepaid → hoàn `amount` vào số dư (không vượt tổng đã nạp).
 */
export async function refundPackage(
  tx: Tx,
  customerPackageId: string,
  amount: number,
): Promise<void> {
  const [cp] = await tx
    .select({ kind: customerPackages.kind })
    .from(customerPackages)
    .where(eq(customerPackages.id, customerPackageId));
  if (!cp) return;

  if (cp.kind === "prepaid") {
    await tx
      .update(customerPackages)
      .set({
        balanceRemaining: sql`LEAST(${customerPackages.balanceTotal}, ${customerPackages.balanceRemaining} + ${amount})`,
      })
      .where(eq(customerPackages.id, customerPackageId));
    return;
  }

  await tx
    .update(customerPackages)
    .set({
      sessionsRemaining: sql`LEAST(${customerPackages.sessionsTotal}, ${customerPackages.sessionsRemaining} + 1)`,
    })
    .where(eq(customerPackages.id, customerPackageId));
}
