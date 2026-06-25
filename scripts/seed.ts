import { config } from "dotenv";

// Nạp env trước khi import db (db client đọc env lúc khởi tạo).
config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import { db } from "../src/lib/db";
import {
  closures,
  services,
  shops,
  workingHours,
} from "../src/lib/db/schema";

/**
 * Seed 1 shop demo: dịch vụ mẫu + giờ mở cửa (có nghỉ trưa) + 1 ngày nghỉ.
 * Chạy: pnpm seed
 * Admin (Better Auth) được seed ở Phase 3.
 */
const DEMO_SLUG = "demo";

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
  console.log("  Lưu ý: admin login được seed ở Phase 3 (Better Auth).");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("✗ Seed thất bại:", err);
    process.exit(1);
  });
