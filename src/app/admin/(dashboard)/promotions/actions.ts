"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db";
import { promotions } from "@/lib/db/schema";
import { promotionSchema, type PromotionInput } from "@/lib/validation/promotion";

type ActionResult = { ok: true } | { ok: false; error: string };

function isDuplicateCodeError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return msg.includes("promotions_shop_code_uniq") || msg.includes("unique");
  }
  return false;
}

export async function createPromotion(input: PromotionInput): Promise<ActionResult> {
  try {
    const { shopId } = await requireAdmin();
    const parsed = promotionSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
    }

    const { code, discountType, value, startDate, endDate, usageLimit, active } = parsed.data;

    await db.insert(promotions).values({
      shopId,
      code,
      discountType,
      value,
      startDate,
      endDate,
      usageLimit: usageLimit ?? null,
      active,
    });

    revalidatePath("/admin/promotions");
    return { ok: true };
  } catch (err) {
    if (isDuplicateCodeError(err)) {
      return { ok: false, error: "Mã khuyến mãi đã tồn tại" };
    }
    console.error("[createPromotion]", err);
    return { ok: false, error: "Lỗi server, vui lòng thử lại" };
  }
}

export async function updatePromotion(id: string, input: PromotionInput): Promise<ActionResult> {
  try {
    const { shopId } = await requireAdmin();
    const parsed = promotionSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
    }

    const { code, discountType, value, startDate, endDate, usageLimit, active } = parsed.data;

    await db
      .update(promotions)
      .set({ code, discountType, value, startDate, endDate, usageLimit: usageLimit ?? null, active })
      .where(and(eq(promotions.id, id), eq(promotions.shopId, shopId)));

    revalidatePath("/admin/promotions");
    return { ok: true };
  } catch (err) {
    if (isDuplicateCodeError(err)) {
      return { ok: false, error: "Mã khuyến mãi đã tồn tại" };
    }
    console.error("[updatePromotion]", err);
    return { ok: false, error: "Lỗi server, vui lòng thử lại" };
  }
}

export async function togglePromotionActive(id: string): Promise<ActionResult> {
  try {
    const { shopId } = await requireAdmin();

    const [promo] = await db
      .select({ active: promotions.active })
      .from(promotions)
      .where(and(eq(promotions.id, id), eq(promotions.shopId, shopId)))
      .limit(1);

    if (!promo) return { ok: false, error: "Không tìm thấy khuyến mãi" };

    await db
      .update(promotions)
      .set({ active: !promo.active })
      .where(and(eq(promotions.id, id), eq(promotions.shopId, shopId)));

    revalidatePath("/admin/promotions");
    return { ok: true };
  } catch (err) {
    console.error("[togglePromotionActive]", err);
    return { ok: false, error: "Lỗi server, vui lòng thử lại" };
  }
}

export async function deletePromotion(id: string): Promise<ActionResult> {
  try {
    const { shopId } = await requireAdmin();

    await db
      .delete(promotions)
      .where(and(eq(promotions.id, id), eq(promotions.shopId, shopId)));

    revalidatePath("/admin/promotions");
    return { ok: true };
  } catch (err) {
    console.error("[deletePromotion]", err);
    return { ok: false, error: "Lỗi server, vui lòng thử lại" };
  }
}
