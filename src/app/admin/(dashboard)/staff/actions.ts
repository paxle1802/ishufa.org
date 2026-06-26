"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db";
import { shops, staff } from "@/lib/db/schema";
import { staffSchema } from "@/lib/validation/staff";

type Result = { ok: true } | { ok: false; error: string };

function fail(e: unknown): Result {
  return { ok: false, error: e instanceof Error ? e.message : "Lỗi máy chủ" };
}

/** Chủ shop tạo thợ. */
export async function createStaff(input: unknown): Promise<Result> {
  try {
    const { shopId } = await requireAdmin();
    const parsed = staffSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
    await db.insert(staff).values({ shopId, ...parsed.data });
    revalidatePath("/admin/staff");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updateStaff(staffId: string, input: unknown): Promise<Result> {
  try {
    const { shopId } = await requireAdmin();
    const parsed = staffSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
    await db.update(staff).set(parsed.data).where(and(eq(staff.id, staffId), eq(staff.shopId, shopId)));
    revalidatePath("/admin/staff");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteStaff(staffId: string): Promise<Result> {
  try {
    const { shopId } = await requireAdmin();
    await db.delete(staff).where(and(eq(staff.id, staffId), eq(staff.shopId, shopId)));
    revalidatePath("/admin/staff");
    revalidatePath("/admin/services");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Chọn chế độ doanh thu: 'per_staff' (chia theo thợ) | 'combined' (gộp). */
export async function saveRevenueMode(mode: "per_staff" | "combined"): Promise<Result> {
  try {
    const { shopId } = await requireAdmin();
    if (mode !== "per_staff" && mode !== "combined") {
      return { ok: false, error: "Chế độ không hợp lệ" };
    }
    await db.update(shops).set({ revenueMode: mode }).where(eq(shops.id, shopId));
    revalidatePath("/admin/staff");
    revalidatePath("/admin/revenue");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
