"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db";
import { getShopById } from "@/lib/db/queries";
import { workingHours, closures, shops } from "@/lib/db/schema";
import {
  workingHoursSchema,
  closureSchema,
  bookingSettingsSchema,
} from "@/lib/validation/admin";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function saveWorkingHours(
  intervals: unknown,
): Promise<ActionResult> {
  try {
    const { shopId } = await requireAdmin();
    const parsed = workingHoursSchema.safeParse({ intervals });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
    }

    await db.delete(workingHours).where(eq(workingHours.shopId, shopId));

    if (parsed.data.intervals.length > 0) {
      await db.insert(workingHours).values(
        parsed.data.intervals.map((interval) => ({ ...interval, shopId })),
      );
    }

    revalidatePath("/admin/schedule");
    const shop = await getShopById(shopId);
    if (shop) revalidatePath(`/s/${shop.slug}`);

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi máy chủ";
    return { ok: false, error: message };
  }
}

export async function addClosure(input: unknown): Promise<ActionResult> {
  try {
    const { shopId } = await requireAdmin();
    const parsed = closureSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
    }

    const reason = parsed.data.reason?.trim() || null;

    await db.insert(closures).values({
      shopId,
      date: parsed.data.date,
      reason,
    });

    revalidatePath("/admin/schedule");
    const shop = await getShopById(shopId);
    if (shop) revalidatePath(`/s/${shop.slug}`);

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi máy chủ";
    return { ok: false, error: message };
  }
}

export async function deleteClosure(id: string): Promise<ActionResult> {
  try {
    const { shopId } = await requireAdmin();

    await db
      .delete(closures)
      .where(and(eq(closures.id, id), eq(closures.shopId, shopId)));

    revalidatePath("/admin/schedule");
    const shop = await getShopById(shopId);
    if (shop) revalidatePath(`/s/${shop.slug}`);

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi máy chủ";
    return { ok: false, error: message };
  }
}

export async function saveSettings(input: unknown): Promise<ActionResult> {
  try {
    const { shopId } = await requireAdmin();
    const parsed = bookingSettingsSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
    }

    await db.update(shops).set(parsed.data).where(eq(shops.id, shopId));

    revalidatePath("/admin/schedule");
    const shop = await getShopById(shopId);
    if (shop) revalidatePath(`/s/${shop.slug}`);

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi máy chủ";
    return { ok: false, error: message };
  }
}
