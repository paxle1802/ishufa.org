import { and, asc, desc, eq } from "drizzle-orm";

import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db";
import { packagePurchases, packages } from "@/lib/db/schema";
import { listActiveServices } from "@/lib/db/queries";
import { PackagesManager } from "./packages-manager";
import { PurchaseRequests } from "./purchase-requests";

export default async function PackagesPage() {
  const { shopId } = await requireAdmin();

  const [pkgs, services, pending] = await Promise.all([
    db
      .select()
      .from(packages)
      .where(eq(packages.shopId, shopId))
      .orderBy(asc(packages.sortOrder)),
    listActiveServices(shopId),
    db
      .select()
      .from(packagePurchases)
      .where(
        and(
          eq(packagePurchases.shopId, shopId),
          eq(packagePurchases.status, "pending"),
        ),
      )
      .orderBy(desc(packagePurchases.createdAt)),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Gói trả trước</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý mẫu gói combo bán cho khách.
        </p>
      </div>

      <PurchaseRequests
        requests={pending.map((p) => ({
          id: p.id,
          packageName: p.packageName,
          customerName: p.customerName,
          customerPhone: p.customerPhone,
          amount: p.amount,
          refCode: p.refCode,
          createdAt: p.createdAt,
        }))}
      />

      <PackagesManager packages={pkgs} services={services} />
    </div>
  );
}
