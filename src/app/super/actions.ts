"use server";

import { and, eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/lib/auth/require-admin";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { account, shops, user } from "@/lib/db/schema";
import { loginIdentifierFromEmail, phoneToLoginEmail } from "@/lib/phone-login";
import { slugify } from "@/lib/slug";
import { createShopSchema } from "@/lib/validation/shop-provision";

// Mật khẩu dễ đọc (không ký tự gây nhầm).
const genPassword = customAlphabet("abcdefghijkmnpqrstuvwxyz23456789", 10);

type CreateResult =
  | { ok: true; shopName: string; slug: string; loginEmail: string; password: string }
  | { ok: false; error: string };

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  for (let i = 0; i < 50; i++) {
    const existing = await db.select({ id: shops.id }).from(shops).where(eq(shops.slug, slug));
    if (existing.length === 0) return slug;
    slug = `${base}-${i + 2}`;
  }
  return `${base}-${nanoid(5)}`;
}

/** Super admin tạo shop mới + tài khoản chủ shop (sinh mật khẩu trả về 1 lần). */
export async function createShop(input: unknown): Promise<CreateResult> {
  try {
    await requireSuperAdmin();
    const parsed = createShopSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
    }
    const { shopName, ownerName, ownerPhone, ownerEmail } = parsed.data;

    // Chủ shop đăng nhập bằng SĐT (lưu nội bộ dạng <sđt>@ishufa.app).
    const loginEmail = phoneToLoginEmail(ownerPhone);
    const taken = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, loginEmail))
      .limit(1);
    if (taken.length > 0) {
      return { ok: false, error: "Số điện thoại này đã được dùng cho shop khác" };
    }

    const slug = await uniqueSlug(slugify(shopName));
    const password = genPassword();

    const ctx = await auth.$context;
    const hashed = await ctx.password.hash(password);
    const userId = nanoid();

    const [shop] = await db
      .insert(shops)
      .values({
        slug,
        name: shopName,
        contactPhone: ownerPhone,
        email: ownerEmail && ownerEmail.length > 0 ? ownerEmail : null,
      })
      .returning({ id: shops.id });

    await db.insert(user).values({
      id: userId,
      name: ownerName,
      email: loginEmail,
      emailVerified: true,
      role: "owner",
      shopId: shop.id,
      mustChangePassword: true, // bắt buộc đổi ở lần đăng nhập đầu
    });
    await db.insert(account).values({
      id: nanoid(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: hashed,
    });

    revalidatePath("/super");
    // Hiển thị SĐT (định danh chủ shop dùng để đăng nhập), không lộ email nội bộ.
    return { ok: true, shopName, slug, loginEmail: loginIdentifierFromEmail(loginEmail), password };
  } catch (e) {
    console.error("[createShop]", e);
    return { ok: false, error: "Tạo shop thất bại, vui lòng thử lại." };
  }
}

type ResetResult =
  | { ok: true; loginEmail: string; password: string }
  | { ok: false; error: string };

/** Super admin reset mật khẩu chủ shop → sinh mật khẩu mới + buộc đổi khi đăng nhập. */
export async function resetShopPassword(shopId: string): Promise<ResetResult> {
  try {
    await requireSuperAdmin();
    const [owner] = await db
      .select({ id: user.id, email: user.email })
      .from(user)
      .where(and(eq(user.shopId, shopId), eq(user.role, "owner")))
      .limit(1);
    if (!owner) return { ok: false, error: "Shop chưa có tài khoản chủ" };

    const password = genPassword();
    const ctx = await auth.$context;
    const hashed = await ctx.password.hash(password);

    await db
      .update(account)
      .set({ password: hashed })
      .where(and(eq(account.userId, owner.id), eq(account.providerId, "credential")));
    await db
      .update(user)
      .set({ mustChangePassword: true })
      .where(eq(user.id, owner.id));

    revalidatePath("/super");
    return { ok: true, loginEmail: loginIdentifierFromEmail(owner.email), password };
  } catch (e) {
    console.error("[resetShopPassword]", e);
    return { ok: false, error: "Reset mật khẩu thất bại." };
  }
}
