import { and, eq, gte, inArray, lt } from "drizzle-orm";

import { db } from "@/lib/db";
import { bookingItems, bookings, staff } from "@/lib/db/schema";

export interface StaffRevenueRow {
  staffId: string | null;
  name: string;
  revenue: number; // VND thực thu (net) phân bổ cho thợ
  itemCount: number;
}

export interface StaffRevenueReport {
  rows: StaffRevenueRow[];
  total: number; // tổng net các booking hoàn tất trong kỳ
  bookingCount: number;
}

/**
 * Doanh thu THỰC THU chia theo thợ trong [from, to).
 * Net mỗi booking phân bổ theo tỉ lệ giá từng dịch vụ (priceSnapshot),
 * gom theo staffId đã snapshot trên booking_items. Chỉ tính booking `completed`.
 * Số liệu tính từ dữ liệu — không ai sửa tay được.
 */
export async function getStaffRevenue(
  shopId: string,
  from: Date,
  to: Date,
): Promise<StaffRevenueReport> {
  const bks = await db
    .select({ id: bookings.id, totalPrice: bookings.totalPrice })
    .from(bookings)
    .where(
      and(
        eq(bookings.shopId, shopId),
        eq(bookings.status, "completed"),
        gte(bookings.startAt, from),
        lt(bookings.startAt, to),
      ),
    );

  if (bks.length === 0) return { rows: [], total: 0, bookingCount: 0 };

  const ids = bks.map((b) => b.id);
  const items = await db
    .select({
      bookingId: bookingItems.bookingId,
      staffId: bookingItems.staffId,
      priceSnapshot: bookingItems.priceSnapshot,
    })
    .from(bookingItems)
    .where(inArray(bookingItems.bookingId, ids));

  const byBooking = new Map<string, { staffId: string | null; price: number }[]>();
  for (const it of items) {
    const arr = byBooking.get(it.bookingId) ?? [];
    arr.push({ staffId: it.staffId, price: it.priceSnapshot });
    byBooking.set(it.bookingId, arr);
  }

  const acc = new Map<string | null, { rev: number; cnt: number }>();
  let total = 0;
  for (const b of bks) {
    const its = byBooking.get(b.id) ?? [];
    const gross = its.reduce((s, i) => s + i.price, 0);
    if (gross <= 0) continue;
    total += b.totalPrice;
    for (const it of its) {
      const net = Math.round((it.price / gross) * b.totalPrice);
      const cur = acc.get(it.staffId) ?? { rev: 0, cnt: 0 };
      cur.rev += net;
      cur.cnt += 1;
      acc.set(it.staffId, cur);
    }
  }

  const names = await db
    .select({ id: staff.id, name: staff.name })
    .from(staff)
    .where(eq(staff.shopId, shopId));
  const nameMap = new Map(names.map((s) => [s.id, s.name]));

  const rows: StaffRevenueRow[] = [...acc.entries()]
    .map(([sid, v]) => ({
      staffId: sid,
      name: sid ? (nameMap.get(sid) ?? "(thợ đã xoá)") : "Chưa gán thợ",
      revenue: v.rev,
      itemCount: v.cnt,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return { rows, total, bookingCount: bks.length };
}
