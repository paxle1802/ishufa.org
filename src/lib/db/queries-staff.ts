import { asc, eq } from "drizzle-orm";

import { db } from "./index";
import { shops, staff } from "./schema";

/** Tất cả thợ của 1 shop. */
export function listStaff(shopId: string) {
  return db
    .select()
    .from(staff)
    .where(eq(staff.shopId, shopId))
    .orderBy(asc(staff.sortOrder), asc(staff.name));
}

/** Danh sách shop (cho super admin chọn). */
export function getAllShops() {
  return db
    .select({ id: shops.id, name: shops.name, slug: shops.slug, active: shops.active })
    .from(shops)
    .orderBy(asc(shops.name));
}
