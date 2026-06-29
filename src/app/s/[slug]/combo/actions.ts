"use server";

import { and, eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";

import { db } from "@/lib/db";
import { packagePurchases, packages } from "@/lib/db/schema";
import { getShopBySlug } from "@/lib/db/queries";
import { sendShopNotification } from "@/lib/push/send";
import { normalizePhone } from "@/lib/validation/booking";

const refCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

export type PurchaseResult =
  | {
      ok: true;
      amount: number;
      refCode: string;
      bank: { bankBin: string; accountNumber: string; accountName: string };
    }
  | { ok: false; error: string };

/** Khách yêu cầu mua gói online → tạo yêu cầu pending + trả thông tin VietQR. */
export async function createPackagePurchase(
  slug: string,
  packageId: string,
  rawName: string,
  rawPhone: string,
): Promise<PurchaseResult> {
  try {
    const shop = await getShopBySlug(slug);
    if (!shop || !shop.active) return { ok: false, error: "Salon không tồn tại" };

    if (!shop.bankBin || !shop.bankAccountNumber || !shop.bankAccountName) {
      return { ok: false, error: "Salon chưa cấu hình tài khoản nhận tiền." };
    }

    const name = rawName.trim();
    const phone = normalizePhone(rawPhone);
    if (!name) return { ok: false, error: "Nhập tên của bạn" };
    if (!/^0\d{9,10}$/.test(phone)) {
      return { ok: false, error: "Số điện thoại không hợp lệ" };
    }

    const [pkg] = await db
      .select()
      .from(packages)
      .where(and(eq(packages.id, packageId), eq(packages.shopId, shop.id)));
    if (!pkg || !pkg.active) return { ok: false, error: "Gói không khả dụng" };

    const code = `G${refCode()}`;
    await db.insert(packagePurchases).values({
      shopId: shop.id,
      packageId: pkg.id,
      packageName: pkg.name,
      customerName: name,
      customerPhone: phone,
      amount: pkg.price,
      refCode: code,
    });

    // Báo chủ shop có yêu cầu mua (best-effort).
    try {
      await sendShopNotification(shop.id, {
        title: "Có yêu cầu mua gói",
        body: `${name} · ${pkg.name} · ${new Intl.NumberFormat("vi-VN").format(pkg.price)}đ`,
        url: "/admin/packages",
      });
    } catch {
      /* bỏ qua */
    }

    return {
      ok: true,
      amount: pkg.price,
      refCode: code,
      bank: {
        bankBin: shop.bankBin,
        accountNumber: shop.bankAccountNumber,
        accountName: shop.bankAccountName,
      },
    };
  } catch {
    return { ok: false, error: "Lỗi máy chủ, vui lòng thử lại" };
  }
}
