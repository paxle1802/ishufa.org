import { and, asc, eq, gte, like, lt, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { bookings, expenses } from "@/lib/db/schema";
import { dayRange, monthRange } from "@/lib/tz";

/** Doanh thu NET (booking đã hoàn tất) trong khoảng [from,to) theo startAt. */
async function revenueInRange(shopId: string, from: Date, to: Date): Promise<number> {
  const [r] = await db
    .select({ total: sql<number>`COALESCE(SUM(${bookings.totalPrice}),0)`.mapWith(Number) })
    .from(bookings)
    .where(
      and(
        eq(bookings.shopId, shopId),
        eq(bookings.status, "completed"),
        gte(bookings.startAt, from),
        lt(bookings.startAt, to),
      ),
    );
  return r?.total ?? 0;
}

/** Tổng chi phí theo điều kiện ngày (string yyyy-MM-dd). */
async function expenseSum(shopId: string, dateCond: ReturnType<typeof eq>): Promise<number> {
  const [r] = await db
    .select({ total: sql<number>`COALESCE(SUM(${expenses.amount}),0)`.mapWith(Number) })
    .from(expenses)
    .where(and(eq(expenses.shopId, shopId), dateCond));
  return r?.total ?? 0;
}

export interface PnL {
  revenue: number;
  expense: number;
  profit: number;
}

/** Lợi nhuận ngày + tháng: doanh thu − chi phí. */
export async function getFinanceSummary(
  shopId: string,
  day: string, // yyyy-MM-dd
  month: string, // yyyy-MM
): Promise<{ day: PnL; month: PnL }> {
  const d = dayRange(day);
  const m = monthRange(month);

  const [dayRev, dayExp, monthRev, monthExp] = await Promise.all([
    revenueInRange(shopId, d.from, d.to),
    expenseSum(shopId, eq(expenses.date, day)),
    revenueInRange(shopId, m.from, m.to),
    expenseSum(shopId, like(expenses.date, `${month}-%`)),
  ]);

  return {
    day: { revenue: dayRev, expense: dayExp, profit: dayRev - dayExp },
    month: { revenue: monthRev, expense: monthExp, profit: monthRev - monthExp },
  };
}

/** Danh sách chi phí của 1 ngày. */
export function listExpensesForDay(shopId: string, day: string) {
  return db
    .select()
    .from(expenses)
    .where(and(eq(expenses.shopId, shopId), eq(expenses.date, day)))
    .orderBy(asc(expenses.createdAt));
}
