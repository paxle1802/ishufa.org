// Backfill bảng customers từ các booking đã `completed`.
// Idempotent: tính lại từ nguồn rồi SET (không cộng dồn) → chạy lại an toàn.
// Chạy: pnpm tsx --env-file=.env.local scripts/backfill-customers.ts
import { eq } from "drizzle-orm";
import { db } from "../src/lib/db";
import { bookings, customers } from "../src/lib/db/schema";
import { generateAccessToken } from "../src/lib/customers/access-token";
import { normalizePhone } from "../src/lib/validation/booking";

interface Agg {
  shopId: string;
  phone: string;
  name: string;
  visitCount: number;
  totalSpent: number;
  lastVisitAt: Date;
}

async function main() {
  const rows = await db
    .select({
      shopId: bookings.shopId,
      phone: bookings.customerPhone,
      name: bookings.customerName,
      totalPrice: bookings.totalPrice,
      startAt: bookings.startAt,
    })
    .from(bookings)
    .where(eq(bookings.status, "completed"));

  const map = new Map<string, Agg>();
  for (const r of rows) {
    const phone = normalizePhone(r.phone);
    const key = `${r.shopId}::${phone}`;
    const cur = map.get(key);
    if (!cur) {
      map.set(key, {
        shopId: r.shopId,
        phone,
        name: r.name,
        visitCount: 1,
        totalSpent: r.totalPrice,
        lastVisitAt: r.startAt,
      });
    } else {
      cur.visitCount += 1;
      cur.totalSpent += r.totalPrice;
      if (r.startAt > cur.lastVisitAt) {
        cur.lastVisitAt = r.startAt;
        cur.name = r.name; // tên theo lần ghé gần nhất
      }
    }
  }

  let n = 0;
  for (const a of map.values()) {
    await db
      .insert(customers)
      .values({
        shopId: a.shopId,
        name: a.name,
        phone: a.phone,
        accessToken: generateAccessToken(),
        visitCount: a.visitCount,
        totalSpent: a.totalSpent,
        lastVisitAt: a.lastVisitAt,
      })
      .onConflictDoUpdate({
        target: [customers.shopId, customers.phone],
        set: {
          name: a.name,
          visitCount: a.visitCount,
          totalSpent: a.totalSpent,
          lastVisitAt: a.lastVisitAt,
        },
      });
    n += 1;
  }
  console.log(`✓ Backfill xong: ${n} khách hàng từ ${rows.length} booking hoàn tất.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
