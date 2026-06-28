import { and, eq } from "drizzle-orm";

import { pooledDb } from "@/lib/db/pooled";
import { customerPackages, packages } from "@/lib/db/schema";

type Result = { ok: true } | { ok: false; error: string };

const MS_PER_DAY = 86_400_000;

/**
 * Bán gói combo tại quầy (đã thu tiền tay): tạo customer_packages với số dư
 * và hạn dùng = nay + validityDays. Snapshot giá + số buổi.
 */
export async function sellPackage(
  shopId: string,
  customerId: string,
  packageId: string,
): Promise<Result> {
  return pooledDb.transaction(async (tx) => {
    const [pkg] = await tx
      .select()
      .from(packages)
      .where(and(eq(packages.id, packageId), eq(packages.shopId, shopId)));

    if (!pkg || !pkg.active) return { ok: false, error: "Gói không khả dụng" };

    const expiresAt = new Date(Date.now() + pkg.validityDays * MS_PER_DAY);
    const isPrepaid = pkg.kind === "prepaid";
    await tx.insert(customerPackages).values({
      shopId,
      customerId,
      packageId: pkg.id,
      kind: pkg.kind,
      // combo: snapshot số buổi · prepaid: số dư = số tiền nạp.
      sessionsTotal: isPrepaid ? 0 : pkg.sessions,
      sessionsRemaining: isPrepaid ? 0 : pkg.sessions,
      balanceTotal: isPrepaid ? pkg.price : 0,
      balanceRemaining: isPrepaid ? pkg.price : 0,
      pricePaid: pkg.price,
      expiresAt,
    });
    return { ok: true };
  });
}
