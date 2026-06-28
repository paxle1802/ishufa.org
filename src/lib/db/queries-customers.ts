import { and, asc, desc, eq, gt, ilike, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  bookings,
  customerPackages,
  customers,
  loyaltyLedger,
  packages,
} from "@/lib/db/schema";

/**
 * Queries dành cho CRM khách hàng. Luôn scope theo shopId (tenant safety).
 */

export interface ListCustomersOpts {
  search?: string;
  limit?: number;
  offset?: number;
}

/** Danh sách khách, tuỳ chọn tìm theo tên/SĐT. Sắp theo lastVisitAt desc nulls last. */
export function listCustomers(shopId: string, opts: ListCustomersOpts = {}) {
  const { search, limit = 50, offset = 0 } = opts;

  const whereClause = search
    ? and(
        eq(customers.shopId, shopId),
        or(
          ilike(customers.name, `%${search}%`),
          ilike(customers.phone, `%${search}%`),
        ),
      )
    : eq(customers.shopId, shopId);

  return db
    .select()
    .from(customers)
    .where(whereClause)
    .orderBy(
      // nulls last — khách chưa từng ghé đứng cuối
      sql`${customers.lastVisitAt} desc nulls last`,
      desc(customers.createdAt),
    )
    .limit(limit)
    .offset(offset);
}

/** Lấy 1 khách theo SĐT trong shop. */
export function getCustomerByPhone(shopId: string, phone: string) {
  return db.query.customers.findFirst({
    where: and(eq(customers.shopId, shopId), eq(customers.phone, phone)),
  });
}

/** Lấy 1 khách theo access_token (cho trang công khai /kh/[token]). */
export function getCustomerByToken(token: string) {
  return db.query.customers.findFirst({
    where: eq(customers.accessToken, token),
  });
}

/** Lịch sử booking của 1 SĐT trong shop (kèm dịch vụ). */
export function listBookingsByPhone(shopId: string, phone: string) {
  return db.query.bookings.findMany({
    where: and(
      eq(bookings.shopId, shopId),
      eq(bookings.customerPhone, phone),
    ),
    orderBy: desc(bookings.startAt),
    with: {
      items: { with: { service: { columns: { name: true } } } },
    },
  });
}

/** Sổ cái điểm tích luỹ của khách. */
export function getCustomerLedger(
  shopId: string,
  customerId: string,
  limit = 20,
) {
  return db
    .select()
    .from(loyaltyLedger)
    .where(
      and(
        eq(loyaltyLedger.shopId, shopId),
        eq(loyaltyLedger.customerId, customerId),
      ),
    )
    .orderBy(desc(loyaltyLedger.createdAt))
    .limit(limit);
}

/** Gói combo còn buổi và chưa hết hạn của khách, kèm tên gói. */
export async function getActiveCustomerPackages(
  shopId: string,
  customerId: string,
) {
  const rows = await db
    .select({
      id: customerPackages.id,
      sessionsTotal: customerPackages.sessionsTotal,
      sessionsRemaining: customerPackages.sessionsRemaining,
      pricePaid: customerPackages.pricePaid,
      purchasedAt: customerPackages.purchasedAt,
      expiresAt: customerPackages.expiresAt,
      packageName: packages.name,
    })
    .from(customerPackages)
    .leftJoin(packages, eq(customerPackages.packageId, packages.id))
    .where(
      and(
        eq(customerPackages.shopId, shopId),
        eq(customerPackages.customerId, customerId),
        gt(customerPackages.sessionsRemaining, 0),
        gt(customerPackages.expiresAt, new Date()),
      ),
    )
    .orderBy(asc(customerPackages.expiresAt));

  return rows;
}

/** Tất cả gói đang bật của shop — dùng cho dropdown "Bán gói". */
export function listActivePackages(shopId: string) {
  return db
    .select()
    .from(packages)
    .where(and(eq(packages.shopId, shopId), eq(packages.active, true)))
    .orderBy(asc(packages.sortOrder));
}

// Exported inferred types
export type CustomerRow = Awaited<ReturnType<typeof listCustomers>>[number];
export type ActiveCustomerPackage = Awaited<
  ReturnType<typeof getActiveCustomerPackages>
>[number];
export type BookingWithItems = Awaited<
  ReturnType<typeof listBookingsByPhone>
>[number];
export type LedgerRow = Awaited<ReturnType<typeof getCustomerLedger>>[number];
export type ActivePackage = Awaited<ReturnType<typeof listActivePackages>>[number];
