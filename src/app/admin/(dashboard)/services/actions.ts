"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-admin";
import { uploadImage } from "@/lib/blob";
import { db } from "@/lib/db";
import { getShopById } from "@/lib/db/queries";
import { services } from "@/lib/db/schema";
import { serviceSchema, type ServiceInput } from "@/lib/validation/admin";

type ActionResult = { ok: true } | { ok: false; error: string };
type UploadResult = { ok: true; url: string } | { ok: false; error: string };

/** Upload ảnh minh hoạ cho dịch vụ → trả URL để gắn vào form. */
export async function uploadServiceImageAction(
  formData: FormData,
): Promise<UploadResult> {
  try {
    const { shopId } = await requireAdmin();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Vui lòng chọn file ảnh" };
    }
    if (file.size > 4 * 1024 * 1024) {
      return { ok: false, error: "Ảnh tối đa 4 MB" };
    }

    const shop = await getShopById(shopId);
    if (!shop) return { ok: false, error: "Không tìm thấy salon" };

    const url = await uploadImage(file, `services/${shop.slug}`);
    return { ok: true, url };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi upload ảnh";
    console.error("[uploadServiceImageAction]", err);
    return { ok: false, error: message };
  }
}

function toNullableString(val: string | undefined): string | null {
  if (val === undefined || val === "") return null;
  return val;
}

async function revalidateServicePaths(shopSlug: string) {
  revalidatePath("/admin/services");
  revalidatePath(`/s/${shopSlug}`);
}

export async function createService(input: ServiceInput): Promise<ActionResult> {
  try {
    const { shopId } = await requireAdmin();
    const parsed = serviceSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
    }

    const shop = await getShopById(shopId);
    if (!shop) return { ok: false, error: "Không tìm thấy salon" };

    const { name, price, durationMin, category, description, imageUrl, staffId, active, sortOrder } =
      parsed.data;

    await db.insert(services).values({
      shopId,
      name,
      price,
      durationMin,
      category: toNullableString(category),
      description: toNullableString(description),
      imageUrl: toNullableString(imageUrl),
      staffId: staffId ?? null,
      active,
      sortOrder,
    });

    await revalidateServicePaths(shop.slug);
    return { ok: true };
  } catch (err) {
    console.error("[createService]", err);
    return { ok: false, error: "Lỗi server, vui lòng thử lại" };
  }
}

export async function updateService(
  id: string,
  input: ServiceInput,
): Promise<ActionResult> {
  try {
    const { shopId } = await requireAdmin();
    const parsed = serviceSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
    }

    const shop = await getShopById(shopId);
    if (!shop) return { ok: false, error: "Không tìm thấy salon" };

    const { name, price, durationMin, category, description, imageUrl, staffId, active, sortOrder } =
      parsed.data;

    await db
      .update(services)
      .set({
        name,
        price,
        durationMin,
        category: toNullableString(category),
        description: toNullableString(description),
        imageUrl: toNullableString(imageUrl),
        staffId: staffId ?? null,
        active,
        sortOrder,
      })
      .where(and(eq(services.id, id), eq(services.shopId, shopId)));

    await revalidateServicePaths(shop.slug);
    return { ok: true };
  } catch (err) {
    console.error("[updateService]", err);
    return { ok: false, error: "Lỗi server, vui lòng thử lại" };
  }
}

export async function toggleServiceActive(id: string): Promise<ActionResult> {
  try {
    const { shopId } = await requireAdmin();

    const [svc] = await db
      .select({ active: services.active })
      .from(services)
      .where(and(eq(services.id, id), eq(services.shopId, shopId)))
      .limit(1);

    if (!svc) return { ok: false, error: "Không tìm thấy dịch vụ" };

    const shop = await getShopById(shopId);
    if (!shop) return { ok: false, error: "Không tìm thấy salon" };

    await db
      .update(services)
      .set({ active: !svc.active })
      .where(and(eq(services.id, id), eq(services.shopId, shopId)));

    await revalidateServicePaths(shop.slug);
    return { ok: true };
  } catch (err) {
    console.error("[toggleServiceActive]", err);
    return { ok: false, error: "Lỗi server, vui lòng thử lại" };
  }
}

export async function deleteService(id: string): Promise<ActionResult> {
  try {
    const { shopId } = await requireAdmin();

    const shop = await getShopById(shopId);
    if (!shop) return { ok: false, error: "Không tìm thấy salon" };

    await db
      .delete(services)
      .where(and(eq(services.id, id), eq(services.shopId, shopId)));

    await revalidateServicePaths(shop.slug);
    return { ok: true };
  } catch (err) {
    console.error("[deleteService]", err);
    return { ok: false, error: "Lỗi server, vui lòng thử lại" };
  }
}
