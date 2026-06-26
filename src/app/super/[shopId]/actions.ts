"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db";
import { services, staff } from "@/lib/db/schema";
import { assignServiceStaffSchema, staffSchema } from "@/lib/validation/staff";

type Result = { ok: true } | { ok: false; error: string };

function err(e: unknown): Result {
  return { ok: false, error: e instanceof Error ? e.message : "Lỗi máy chủ" };
}

/** Tạo thợ cho 1 shop. Chỉ super admin. */
export async function createStaff(shopId: string, input: unknown): Promise<Result> {
  try {
    await requireSuperAdmin();
    const parsed = staffSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
    await db.insert(staff).values({ shopId, ...parsed.data });
    revalidatePath(`/super/${shopId}`);
    return { ok: true };
  } catch (e) {
    return err(e);
  }
}

export async function updateStaff(shopId: string, staffId: string, input: unknown): Promise<Result> {
  try {
    await requireSuperAdmin();
    const parsed = staffSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
    await db.update(staff).set(parsed.data).where(and(eq(staff.id, staffId), eq(staff.shopId, shopId)));
    revalidatePath(`/super/${shopId}`);
    return { ok: true };
  } catch (e) {
    return err(e);
  }
}

export async function deleteStaff(shopId: string, staffId: string): Promise<Result> {
  try {
    await requireSuperAdmin();
    // FK set null: services.staffId & booking_items.staffId tự gỡ liên kết.
    await db.delete(staff).where(and(eq(staff.id, staffId), eq(staff.shopId, shopId)));
    revalidatePath(`/super/${shopId}`);
    return { ok: true };
  } catch (e) {
    return err(e);
  }
}

/** Gán (hoặc bỏ gán) thợ cho 1 dịch vụ. */
export async function assignServiceStaff(
  shopId: string,
  serviceId: string,
  staffId: string | null,
): Promise<Result> {
  try {
    await requireSuperAdmin();
    const parsed = assignServiceStaffSchema.safeParse({ serviceId, staffId });
    if (!parsed.success) return { ok: false, error: "Dữ liệu không hợp lệ" };
    await db
      .update(services)
      .set({ staffId: parsed.data.staffId })
      .where(and(eq(services.id, serviceId), eq(services.shopId, shopId)));
    revalidatePath(`/super/${shopId}`);
    return { ok: true };
  } catch (e) {
    return err(e);
  }
}
