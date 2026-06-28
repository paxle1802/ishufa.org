"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db";
import { staff } from "@/lib/db/schema";
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

/** Đặt cách tính lương: lương cứng (VND/tháng) + ăn chia % (0–100). */
export async function setStaffPay(
  staffId: string,
  baseSalary: number,
  commissionPct: number,
): Promise<Result> {
  try {
    const { shopId } = await requireAdmin();
    if (!Number.isInteger(baseSalary) || baseSalary < 0) {
      return { ok: false, error: "Lương cứng không hợp lệ" };
    }
    if (!Number.isInteger(commissionPct) || commissionPct < 0 || commissionPct > 100) {
      return { ok: false, error: "Tỷ lệ ăn chia không hợp lệ" };
    }
    await db
      .update(staff)
      .set({ baseSalary, commissionPct })
      .where(and(eq(staff.id, staffId), eq(staff.shopId, shopId)));
    revalidatePath("/admin/staff");
    revalidatePath("/admin/revenue");
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
