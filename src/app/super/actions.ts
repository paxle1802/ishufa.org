"use server";

import { eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/lib/auth/require-admin";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { account, shops, user } from "@/lib/db/schema";
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

async function uniqueEmail(base: string): Promise<string> {
  const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, base));
  if (existing.length === 0) return base;
  const [local, domain] = base.split("@");
  return `${local}-${nanoid(4)}@${domain}`;
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

    const slug = await uniqueSlug(slugify(shopName));
    const loginEmail = await uniqueEmail(
      ownerEmail && ownerEmail.length > 0 ? ownerEmail : `owner+${slug}@ishufa.app`,
    );
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
    });
    await db.insert(account).values({
      id: nanoid(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: hashed,
    });

    revalidatePath("/super");
    return { ok: true, shopName, slug, loginEmail, password };
  } catch (e) {
    console.error("[createShop]", e);
    return { ok: false, error: "Tạo shop thất bại, vui lòng thử lại." };
  }
}
