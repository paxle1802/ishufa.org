"use server";

import { and, eq } from "drizzle-orm";

import { requireSession } from "@/lib/auth/require-admin";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { account, user } from "@/lib/db/schema";
import { changePasswordSchema } from "@/lib/validation/password";

type Result = { ok: true } | { ok: false; error: string };

/** Đặt mật khẩu mới cho chính người đang đăng nhập + bỏ cờ bắt buộc đổi. */
export async function forceSetPassword(password: string, confirm: string): Promise<Result> {
  try {
    const { user: u } = await requireSession();
    const parsed = changePasswordSchema.safeParse({ password, confirm });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
    }

    const ctx = await auth.$context;
    const hashed = await ctx.password.hash(parsed.data.password);

    await db
      .update(account)
      .set({ password: hashed })
      .where(and(eq(account.userId, u.id), eq(account.providerId, "credential")));
    await db.update(user).set({ mustChangePassword: false }).where(eq(user.id, u.id));

    return { ok: true };
  } catch {
    return { ok: false, error: "Đổi mật khẩu thất bại, vui lòng thử lại." };
  }
}
