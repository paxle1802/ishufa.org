import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { generateAccessToken } from "@/lib/customers/access-token";
import { normalizePhone } from "@/lib/validation/booking";

/**
 * Đảm bảo có bản ghi khách (theo shop + SĐT) để cấp access_token cho "Trang của tôi".
 * KHÔNG đụng tới visitCount/totalSpent (số liệu CRM chỉ cộng khi booking `completed`).
 * Trả access_token (mới tạo hoặc đã có). Idempotent.
 */
export async function ensureCustomerToken(
  shopId: string,
  rawPhone: string,
  name: string,
): Promise<string> {
  const phone = normalizePhone(rawPhone);

  const [inserted] = await db
    .insert(customers)
    .values({ shopId, name, phone, accessToken: generateAccessToken() })
    .onConflictDoNothing({ target: [customers.shopId, customers.phone] })
    .returning({ accessToken: customers.accessToken });

  if (inserted) return inserted.accessToken;

  // Đã tồn tại → lấy token hiện có.
  const existing = await db.query.customers.findFirst({
    where: and(eq(customers.shopId, shopId), eq(customers.phone, phone)),
    columns: { accessToken: true },
  });
  return existing?.accessToken ?? "";
}

/** Đảm bảo có bản ghi khách và trả customerId (tạo nếu chưa có). */
export async function ensureCustomerId(
  shopId: string,
  rawPhone: string,
  name: string,
): Promise<string> {
  const phone = normalizePhone(rawPhone);
  const [inserted] = await db
    .insert(customers)
    .values({ shopId, name, phone, accessToken: generateAccessToken() })
    .onConflictDoNothing({ target: [customers.shopId, customers.phone] })
    .returning({ id: customers.id });
  if (inserted) return inserted.id;

  const existing = await db.query.customers.findFirst({
    where: and(eq(customers.shopId, shopId), eq(customers.phone, phone)),
    columns: { id: true },
  });
  return existing?.id ?? "";
}
