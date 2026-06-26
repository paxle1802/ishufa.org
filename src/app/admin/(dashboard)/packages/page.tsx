import { asc, eq } from "drizzle-orm";

import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db";
import { packages } from "@/lib/db/schema";
import { listActiveServices } from "@/lib/db/queries";
import { PackagesManager } from "./packages-manager";

export default async function PackagesPage() {
  const { shopId } = await requireAdmin();

  const [pkgs, services] = await Promise.all([
    db
      .select()
      .from(packages)
      .where(eq(packages.shopId, shopId))
      .orderBy(asc(packages.sortOrder)),
    listActiveServices(shopId),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Gói trả trước</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý mẫu gói combo bán cho khách.
        </p>
      </div>
      <PackagesManager packages={pkgs} services={services} />
    </div>
  );
}
