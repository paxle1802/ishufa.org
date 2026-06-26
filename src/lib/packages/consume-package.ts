import { and, eq, sql } from "drizzle-orm";

import type { Tx } from "@/lib/db/pooled";
import { customerPackages } from "@/lib/db/schema";

export interface ConsumeResult {
  consumed: boolean;
  warning?: string;
}

/**
 * Trừ 1 buổi của gói combo khi booking hoàn tất.
 * Không chặn hoàn tất: nếu gói hết buổi/hết hạn → bỏ qua + trả cảnh báo.
 */
export async function consumePackageSession(
  tx: Tx,
  shopId: string,
  customerPackageId: string,
  now: Date = new Date(),
): Promise<ConsumeResult> {
  const [cp] = await tx
    .select({
      id: customerPackages.id,
      remaining: customerPackages.sessionsRemaining,
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

  if (!cp) return { consumed: false, warning: "Không tìm thấy gói combo." };
  if (cp.remaining <= 0) return { consumed: false, warning: "Gói đã hết buổi." };
  if (cp.expiresAt.getTime() < now.getTime()) {
    return { consumed: false, warning: "Gói đã hết hạn." };
  }

  await tx
    .update(customerPackages)
    .set({ sessionsRemaining: sql`${customerPackages.sessionsRemaining} - 1` })
    .where(eq(customerPackages.id, cp.id));
  return { consumed: true };
}

/** Hoàn lại 1 buổi (khi đảo trạng thái khỏi completed), không vượt tổng. */
export async function refundPackageSession(
  tx: Tx,
  customerPackageId: string,
): Promise<void> {
  await tx
    .update(customerPackages)
    .set({
      sessionsRemaining: sql`LEAST(${customerPackages.sessionsTotal}, ${customerPackages.sessionsRemaining} + 1)`,
    })
    .where(eq(customerPackages.id, customerPackageId));
}
