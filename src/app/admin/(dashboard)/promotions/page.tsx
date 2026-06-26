import { desc, eq } from "drizzle-orm";

import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db";
import { promotions } from "@/lib/db/schema";
import { PromotionsManager } from "./promotions-manager";

export default async function PromotionsPage() {
  const { shopId } = await requireAdmin();

  const rows = await db
    .select()
    .from(promotions)
    .where(eq(promotions.shopId, shopId))
    .orderBy(desc(promotions.createdAt));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Khuyến mãi</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý mã giảm giá và chương trình khuyến mãi của salon.
        </p>
      </div>
      <PromotionsManager promotions={rows} />
    </div>
  );
}
