import { and, eq, sql } from "drizzle-orm";

import type { Tx } from "@/lib/db/pooled";
import { promotions } from "@/lib/db/schema";
import { APP_TIME_ZONE } from "@/lib/tz";

/** Lỗi mã khuyến mãi không hợp lệ — phân biệt với lỗi hệ thống. */
export class PromoInvalidError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PromoInvalidError";
  }
}

function todayLocal(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Kiểm tra + tiêu thụ mã khuyến mãi NGAY trong transaction tạo booking
 * (đã giữ advisory lock theo shop → tăng usedCount an toàn trước đua tranh).
 * Trả {promoId, discountAmount} hoặc ném PromoInvalidError.
 */
export async function validateAndConsumePromo(
  tx: Tx,
  shopId: string,
  code: string,
  originalTotal: number,
): Promise<{ promoId: string; discountAmount: number }> {
  const normalized = code.trim().toUpperCase();

  const [promo] = await tx
    .select()
    .from(promotions)
    .where(and(eq(promotions.shopId, shopId), eq(promotions.code, normalized)));

  if (!promo || !promo.active) {
    throw new PromoInvalidError("Mã khuyến mãi không hợp lệ.");
  }

  const today = todayLocal();
  if (today < promo.startDate || today > promo.endDate) {
    throw new PromoInvalidError("Mã khuyến mãi đã hết hạn hoặc chưa bắt đầu.");
  }

  const discountAmount =
    promo.discountType === "percent"
      ? Math.floor((originalTotal * promo.value) / 100)
      : Math.min(promo.value, originalTotal);
  const clamped = Math.max(0, Math.min(discountAmount, originalTotal));

  // Tăng lượt dùng, kiểm hạn ngay trong WHERE để an toàn đua tranh.
  const updated = await tx
    .update(promotions)
    .set({ usedCount: sql`${promotions.usedCount} + 1` })
    .where(
      and(
        eq(promotions.id, promo.id),
        promo.usageLimit === null
          ? sql`true`
          : sql`${promotions.usedCount} < ${promo.usageLimit}`,
      ),
    )
    .returning({ id: promotions.id });

  if (updated.length === 0) {
    throw new PromoInvalidError("Mã khuyến mãi đã hết lượt sử dụng.");
  }

  return { promoId: promo.id, discountAmount: clamped };
}
