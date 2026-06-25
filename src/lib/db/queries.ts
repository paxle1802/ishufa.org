import { and, asc, eq } from "drizzle-orm";
import { db } from "./index";
import { closures, services, shops, workingHours } from "./schema";

/**
 * Helper query — luôn ép scope theo shop_id để tách tenant.
 * KHÔNG bao giờ query xuyên shop.
 */

export function getShopBySlug(slug: string) {
  return db.query.shops.findFirst({ where: eq(shops.slug, slug) });
}

export function getShopById(shopId: string) {
  return db.query.shops.findFirst({ where: eq(shops.id, shopId) });
}

/** Dịch vụ đang bật của 1 shop, sắp theo sortOrder. */
export function listActiveServices(shopId: string) {
  return db
    .select()
    .from(services)
    .where(and(eq(services.shopId, shopId), eq(services.active, true)))
    .orderBy(asc(services.sortOrder));
}

/** Tất cả dịch vụ (kể cả tắt) — dùng cho admin. */
export function listAllServices(shopId: string) {
  return db
    .select()
    .from(services)
    .where(eq(services.shopId, shopId))
    .orderBy(asc(services.sortOrder));
}

export function getWorkingHours(shopId: string) {
  return db
    .select()
    .from(workingHours)
    .where(eq(workingHours.shopId, shopId))
    .orderBy(asc(workingHours.weekday), asc(workingHours.openTime));
}

export function getClosures(shopId: string) {
  return db
    .select()
    .from(closures)
    .where(eq(closures.shopId, shopId))
    .orderBy(asc(closures.date));
}
