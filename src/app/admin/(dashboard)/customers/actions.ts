"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { redeemPoints } from "@/lib/loyalty/redeem-points";
import { sellPackage } from "@/lib/packages/sell-package";
import { customerNotesSchema } from "@/lib/validation/customer";
import { redeemSchema } from "@/lib/validation/loyalty";
import { sellPackageSchema } from "@/lib/validation/package";

type ActionResult = { ok: true } | { ok: false; error: string };

function revalidateCustomerPaths(phone?: string) {
  revalidatePath("/admin/customers");
  if (phone) revalidatePath(`/admin/customers/${encodeURIComponent(phone)}`);
}

/** Lưu ghi chú khách hàng (admin). */
export async function saveCustomerNotes(
  customerId: string,
  notes: string,
): Promise<ActionResult> {
  try {
    const { shopId } = await requireAdmin();

    const parsed = customerNotesSchema.safeParse({ notes });
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
      };
    }

    const result = await db
      .update(customers)
      .set({ notes: parsed.data.notes ?? null })
      .where(
        and(eq(customers.id, customerId), eq(customers.shopId, shopId)),
      );

    // If no rows updated, customer doesn't belong to this shop
    if (!result) return { ok: false, error: "Không tìm thấy khách hàng" };

    revalidateCustomerPaths();
    return { ok: true };
  } catch (err) {
    console.error("[saveCustomerNotes]", err);
    return { ok: false, error: "Lỗi server, vui lòng thử lại" };
  }
}

/** Đổi điểm tích luỹ cho khách. */
export async function redeemPointsAction(
  customerId: string,
  points: number,
  note: string,
): Promise<ActionResult> {
  try {
    const { shopId } = await requireAdmin();

    const parsed = redeemSchema.safeParse({ points, note });
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
      };
    }

    // Look up phone for revalidation
    const [customer] = await db
      .select({ phone: customers.phone })
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.shopId, shopId)))
      .limit(1);

    if (!customer) return { ok: false, error: "Không tìm thấy khách hàng" };

    const result = await redeemPoints(
      shopId,
      customerId,
      parsed.data.points,
      parsed.data.note || null,
    );

    if (result.ok) revalidateCustomerPaths(customer.phone);
    return result;
  } catch (err) {
    console.error("[redeemPointsAction]", err);
    return { ok: false, error: "Lỗi server, vui lòng thử lại" };
  }
}

/** Bán gói combo cho khách. */
export async function sellPackageAction(
  customerId: string,
  packageId: string,
): Promise<ActionResult> {
  try {
    const { shopId } = await requireAdmin();

    const parsed = sellPackageSchema.safeParse({ packageId });
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
      };
    }

    // Look up phone for revalidation
    const [customer] = await db
      .select({ phone: customers.phone })
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.shopId, shopId)))
      .limit(1);

    if (!customer) return { ok: false, error: "Không tìm thấy khách hàng" };

    const result = await sellPackage(shopId, customerId, parsed.data.packageId);

    if (result.ok) revalidateCustomerPaths(customer.phone);
    return result;
  } catch (err) {
    console.error("[sellPackageAction]", err);
    return { ok: false, error: "Lỗi server, vui lòng thử lại" };
  }
}
