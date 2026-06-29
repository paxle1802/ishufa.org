"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db";
import { packagePurchases, packages } from "@/lib/db/schema";
import { ensureCustomerId } from "@/lib/customers/ensure-customer";
import { sellPackage } from "@/lib/packages/sell-package";
import { packageSchema, type PackageInput } from "@/lib/validation/package";

type ActionResult = { ok: true } | { ok: false; error: string };

function revalidate() {
  revalidatePath("/admin/packages");
}

/** Chủ shop xác nhận đã nhận tiền → kích hoạt gói cho khách. */
export async function confirmPackagePurchase(id: string): Promise<ActionResult> {
  try {
    const { shopId } = await requireAdmin();
    const [pp] = await db
      .select()
      .from(packagePurchases)
      .where(
        and(
          eq(packagePurchases.id, id),
          eq(packagePurchases.shopId, shopId),
          eq(packagePurchases.status, "pending"),
        ),
      );
    if (!pp) return { ok: false, error: "Không tìm thấy yêu cầu" };
    if (!pp.packageId) return { ok: false, error: "Gói không còn tồn tại, không thể kích hoạt" };

    const customerId = await ensureCustomerId(shopId, pp.customerPhone, pp.customerName);
    if (!customerId) return { ok: false, error: "Không tạo được khách hàng" };

    const sold = await sellPackage(shopId, customerId, pp.packageId);
    if (!sold.ok) return sold;

    await db
      .update(packagePurchases)
      .set({ status: "confirmed", confirmedAt: new Date() })
      .where(eq(packagePurchases.id, id));

    revalidate();
    revalidatePath("/admin");
    revalidatePath("/admin/customers");
    return { ok: true };
  } catch {
    return { ok: false, error: "Lỗi server, vui lòng thử lại" };
  }
}

/** Huỷ/từ chối yêu cầu mua gói. */
export async function cancelPackagePurchase(id: string): Promise<ActionResult> {
  try {
    const { shopId } = await requireAdmin();
    await db
      .update(packagePurchases)
      .set({ status: "cancelled" })
      .where(
        and(
          eq(packagePurchases.id, id),
          eq(packagePurchases.shopId, shopId),
          eq(packagePurchases.status, "pending"),
        ),
      );
    revalidate();
    return { ok: true };
  } catch {
    return { ok: false, error: "Lỗi server, vui lòng thử lại" };
  }
}

export async function createPackage(input: PackageInput): Promise<ActionResult> {
  try {
    const { shopId } = await requireAdmin();
    const parsed = packageSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
    }

    const { name, kind, price, sessions, validityDays, serviceId, active, sortOrder } =
      parsed.data;
    // Prepaid: không dùng số buổi & áp mọi dịch vụ.
    const isPrepaid = kind === "prepaid";

    await db.insert(packages).values({
      shopId,
      name,
      kind,
      price,
      sessions: isPrepaid ? 0 : sessions,
      validityDays,
      serviceId: isPrepaid ? null : serviceId ?? null,
      active,
      sortOrder,
    });

    revalidate();
    return { ok: true };
  } catch (err) {
    console.error("[createPackage]", err);
    return { ok: false, error: "Lỗi server, vui lòng thử lại" };
  }
}

export async function updatePackage(id: string, input: PackageInput): Promise<ActionResult> {
  try {
    const { shopId } = await requireAdmin();
    const parsed = packageSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
    }

    const { name, kind, price, sessions, validityDays, serviceId, active, sortOrder } =
      parsed.data;
    const isPrepaid = kind === "prepaid";

    await db
      .update(packages)
      .set({
        name,
        kind,
        price,
        sessions: isPrepaid ? 0 : sessions,
        validityDays,
        serviceId: isPrepaid ? null : serviceId ?? null,
        active,
        sortOrder,
      })
      .where(and(eq(packages.id, id), eq(packages.shopId, shopId)));

    revalidate();
    return { ok: true };
  } catch (err) {
    console.error("[updatePackage]", err);
    return { ok: false, error: "Lỗi server, vui lòng thử lại" };
  }
}

export async function togglePackageActive(id: string): Promise<ActionResult> {
  try {
    const { shopId } = await requireAdmin();

    const [pkg] = await db
      .select({ active: packages.active })
      .from(packages)
      .where(and(eq(packages.id, id), eq(packages.shopId, shopId)))
      .limit(1);

    if (!pkg) return { ok: false, error: "Không tìm thấy gói" };

    await db
      .update(packages)
      .set({ active: !pkg.active })
      .where(and(eq(packages.id, id), eq(packages.shopId, shopId)));

    revalidate();
    return { ok: true };
  } catch (err) {
    console.error("[togglePackageActive]", err);
    return { ok: false, error: "Lỗi server, vui lòng thử lại" };
  }
}

export async function deletePackage(id: string): Promise<ActionResult> {
  try {
    const { shopId } = await requireAdmin();

    await db
      .delete(packages)
      .where(and(eq(packages.id, id), eq(packages.shopId, shopId)));

    revalidate();
    return { ok: true };
  } catch (err) {
    console.error("[deletePackage]", err);
    return { ok: false, error: "Lỗi server, vui lòng thử lại" };
  }
}
