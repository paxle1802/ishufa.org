"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db";
import { expenses } from "@/lib/db/schema";

type Result = { ok: true } | { ok: false; error: string };

function todayVn(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Saigon" }).format(new Date());
}

/** Thêm 1 khoản chi phí cho ngày (mặc định hôm nay). */
export async function addExpense(
  amount: number,
  note: string,
  date?: string,
): Promise<Result> {
  try {
    const { shopId } = await requireAdmin();
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, error: "Số tiền không hợp lệ" };
    }
    const d = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayVn();
    await db.insert(expenses).values({
      shopId,
      date: d,
      amount: Math.round(amount),
      note: note.trim() || null,
    });
    revalidatePath("/admin/expenses");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Lỗi máy chủ" };
  }
}

export async function deleteExpense(expenseId: string): Promise<Result> {
  try {
    const { shopId } = await requireAdmin();
    await db
      .delete(expenses)
      .where(and(eq(expenses.id, expenseId), eq(expenses.shopId, shopId)));
    revalidatePath("/admin/expenses");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Lỗi máy chủ" };
  }
}
