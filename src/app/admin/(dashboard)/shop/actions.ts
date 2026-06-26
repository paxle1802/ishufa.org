"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { uploadLogo } from "@/lib/blob";
import { db } from "@/lib/db";
import { getShopById } from "@/lib/db/queries";
import { shops } from "@/lib/db/schema";
import { shopInfoSchema, type ShopInfoInput } from "@/lib/validation/admin";

type ActionResult = { ok: true } | { ok: false; error: string };

function toNullable(val: string | undefined): string | null {
  return val === undefined || val === "" ? null : val;
}

function revalidateShopPaths(slug: string) {
  revalidatePath("/admin/shop");
  revalidatePath(`/s/${slug}`);
}

export async function saveShopInfo(input: ShopInfoInput): Promise<ActionResult> {
  try {
    const { shopId } = await requireAdmin();

    const parsed = shopInfoSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
      };
    }

    const shop = await getShopById(shopId);
    if (!shop) return { ok: false, error: "Không tìm thấy salon" };

    const { name, address, description, contactPhone, email, accentColor } =
      parsed.data;

    await db
      .update(shops)
      .set({
        name,
        address: toNullable(address),
        description: toNullable(description),
        contactPhone: toNullable(contactPhone),
        email: toNullable(email),
        accentColor,
      })
      .where(eq(shops.id, shopId));

    revalidateShopPaths(shop.slug);
    return { ok: true };
  } catch (err) {
    console.error("[saveShopInfo]", err);
    return { ok: false, error: "Lỗi server, vui lòng thử lại" };
  }
}

export async function uploadLogoAction(formData: FormData): Promise<ActionResult> {
  try {
    const { shopId } = await requireAdmin();

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Vui lòng chọn file ảnh" };
    }

    const shop = await getShopById(shopId);
    if (!shop) return { ok: false, error: "Không tìm thấy salon" };

    const url = await uploadLogo(file, shop.slug);

    await db.update(shops).set({ logoUrl: url }).where(eq(shops.id, shopId));

    revalidateShopPaths(shop.slug);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi upload logo";
    console.error("[uploadLogoAction]", err);
    return { ok: false, error: message };
  }
}
