// Seed tài khoản super admin + thợ demo + gán dịch vụ cho thợ. Idempotent.
// Chạy: pnpm tsx --env-file=.env.local scripts/seed-super.ts
import { and, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { auth } from "../src/lib/auth/server";
import { db } from "../src/lib/db";
import { account, user } from "../src/lib/db/schema";
import { services, staff } from "../src/lib/db/schema";
import { getShopBySlug } from "../src/lib/db/queries";

const SUPER_EMAIL = "super@ishufa.org";
const SUPER_PASSWORD = "ShufaSuper@2026";

async function main() {
  // --- Super admin ---
  await db.delete(user).where(eq(user.email, SUPER_EMAIL));
  const ctx = await auth.$context;
  const hashed = await ctx.password.hash(SUPER_PASSWORD);
  const uid = nanoid();
  await db.insert(user).values({
    id: uid,
    name: "Super Admin",
    email: SUPER_EMAIL,
    emailVerified: true,
    role: "super_admin",
    shopId: null,
  });
  await db.insert(account).values({
    id: nanoid(),
    accountId: uid,
    providerId: "credential",
    userId: uid,
    password: hashed,
  });
  console.log(`✓ Super admin: ${SUPER_EMAIL} / ${SUPER_PASSWORD}`);

  // --- Thợ demo + gán dịch vụ ---
  const shop = await getShopBySlug("demo");
  if (!shop) {
    console.log("(bỏ qua thợ — chưa có shop demo)");
    process.exit(0);
  }

  const svcs = await db.select().from(services).where(eq(services.shopId, shop.id));
  await db.delete(staff).where(eq(staff.shopId, shop.id)); // reset để idempotent

  const [cat] = await db
    .insert(staff)
    .values({ shopId: shop.id, name: "Thợ cắt", sortOrder: 1 })
    .returning({ id: staff.id });
  const [goi] = await db
    .insert(staff)
    .values({ shopId: shop.id, name: "Thợ gội", sortOrder: 2 })
    .returning({ id: staff.id });

  // Gội → Thợ gội; còn lại (Cắt, Nhuộm, ...) → Thợ cắt.
  const goiIds = svcs.filter((s) => s.category === "Gội").map((s) => s.id);
  const catIds = svcs.filter((s) => s.category !== "Gội").map((s) => s.id);
  if (goiIds.length) {
    await db.update(services).set({ staffId: goi.id }).where(inArray(services.id, goiIds));
  }
  if (catIds.length) {
    await db.update(services).set({ staffId: cat.id }).where(inArray(services.id, catIds));
  }
  console.log(`✓ Thợ: Thợ cắt (${catIds.length} dv), Thợ gội (${goiIds.length} dv)`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
