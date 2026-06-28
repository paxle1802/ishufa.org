"use server";

import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { getShopBySlug } from "@/lib/db/queries";
import {
  clearCustomerSession,
  setCustomerSession,
} from "@/lib/customers/customer-session";
import { verifyPassword } from "@/lib/customers/password";
import { normalizePhone } from "@/lib/validation/booking";

type Result = { ok: true } | { ok: false; error: string };

/** Khách đăng nhập bằng SĐT + mật khẩu (mật khẩu do chủ shop cấp). */
export async function customerLogin(
  slug: string,
  rawPhone: string,
  password: string,
): Promise<Result> {
  try {
    const shop = await getShopBySlug(slug);
    if (!shop) return { ok: false, error: "Salon không tồn tại" };

    const phone = normalizePhone(rawPhone);
    if (!/^0\d{9,10}$/.test(phone)) {
      return { ok: false, error: "Số điện thoại không hợp lệ" };
    }
    if (!password) return { ok: false, error: "Nhập mật khẩu" };

    const customer = await db.query.customers.findFirst({
      where: and(eq(customers.shopId, shop.id), eq(customers.phone, phone)),
      columns: { id: true, passwordHash: true },
    });

    // Thông báo chung để tránh dò SĐT có/không có tài khoản.
    const FAIL = { ok: false, error: "Sai SĐT hoặc mật khẩu" } as const;
    if (!customer?.passwordHash) {
      return {
        ok: false,
        error: "Chưa có tài khoản. Nhờ salon tạo mật khẩu giúp bạn.",
      };
    }
    const valid = await verifyPassword(password, customer.passwordHash);
    if (!valid) return FAIL;

    await setCustomerSession(customer.id);
    return { ok: true };
  } catch {
    return { ok: false, error: "Lỗi máy chủ, vui lòng thử lại" };
  }
}

export async function customerLogout(): Promise<void> {
  await clearCustomerSession();
}
