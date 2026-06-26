// Env được nạp qua `tsx --env-file=.env.local` (xem script "seed" trong package.json),
// chạy trước mọi import nên db client đọc được env lúc khởi tạo.
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { auth } from "../src/lib/auth/server";
import { db } from "../src/lib/db";
import {
  account,
  closures,
  services,
  shops,
  user,
  workingHours,
} from "../src/lib/db/schema";

/**
 * Seed 1 shop demo: dịch vụ mẫu + giờ mở cửa (có nghỉ trưa) + 1 ngày nghỉ + admin.
 * Chạy: pnpm seed
 */
const DEMO_SLUG = "demo";
const ADMIN_EMAIL = "admin@demo.shufabook";
const ADMIN_PASSWORD = "admin12345"; // MVP demo — đổi sau khi đăng nhập lần đầu.

const SERVICES = [
  { name: "Cắt tóc nam", price: 80_000, durationMin: 30, category: "Cắt", sortOrder: 1 },
  { name: "Cắt tóc nữ", price: 120_000, durationMin: 45, category: "Cắt", sortOrder: 2 },
  { name: "Gội đầu dưỡng sinh", price: 100_000, durationMin: 45, category: "Gội", sortOrder: 3 },
  { name: "Gội đầu massage", price: 70_000, durationMin: 30, category: "Gội", sortOrder: 4 },
  { name: "Nhuộm tóc", price: 350_000, durationMin: 90, category: "Nhuộm", sortOrder: 5 },
];

// T2..T7 (1..6): 9:00-12:00 và 13:30-20:00 (nghỉ trưa). CN (0) nghỉ.
const WORKDAY_INTERVALS = [
  { openTime: "09:00", closeTime: "12:00" },
  { openTime: "13:30", closeTime: "20:00" },
];

async function main() {
  console.log("→ Seeding shop demo...");

  // Xoá shop demo cũ nếu có (cascade services/hours/closures/bookings).
  await db.delete(shops).where(eq(shops.slug, DEMO_SLUG));

  const [shop] = await db
    .insert(shops)
    .values({
      slug: DEMO_SLUG,
      name: "Salon Demo",
      address: "123 Đường ABC, Quận 1, TP.HCM",
      description: "Salon mẫu để thử nghiệm đặt lịch.",
      contactPhone: "0900000000",
      accentColor: "#7c3aed",
      capacity: 2,
      slotIntervalMin: 30,
    })
    .returning();

  await db.insert(services).values(
    SERVICES.map((s) => ({ ...s, shopId: shop.id })),
  );

  const hourRows = [1, 2, 3, 4, 5, 6].flatMap((weekday) =>
    WORKDAY_INTERVALS.map((iv) => ({ ...iv, weekday, shopId: shop.id })),
  );
  await db.insert(workingHours).values(hourRows);

  // 1 ngày nghỉ mẫu (Quốc khánh).
  await db.insert(closures).values({
    shopId: shop.id,
    date: "2026-09-02",
    reason: "Nghỉ lễ Quốc khánh",
  });

  console.log(`✓ Đã seed shop "${shop.name}" (slug: ${shop.slug}, id: ${shop.id})`);
  console.log(`  - ${SERVICES.length} dịch vụ, ${hourRows.length} khoảng giờ, 1 ngày nghỉ`);

  // --- Admin (Better Auth) ---
  // Signup public bị tắt nên tạo trực tiếp: hash password bằng context Better Auth,
  // insert user + account (provider "credential"). Xoá admin cũ để chạy lại idempotent.
  await db.delete(user).where(eq(user.email, ADMIN_EMAIL));

  const ctx = await auth.$context;
  const hashed = await ctx.password.hash(ADMIN_PASSWORD);
  const userId = nanoid();

  await db.insert(user).values({
    id: userId,
    name: "Admin Demo",
    email: ADMIN_EMAIL,
    emailVerified: true,
    shopId: shop.id,
  });
  await db.insert(account).values({
    id: nanoid(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: hashed,
  });

  console.log(`✓ Đã tạo admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD} (gắn shop ${shop.slug})`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("✗ Seed thất bại:", err);
    process.exit(1);
  });
