import { requireAdmin } from "@/lib/auth/require-admin";
import { listStaff } from "@/lib/db/queries-staff";
import { getShopById } from "@/lib/db/queries";

import { RevenueModeToggle } from "./revenue-mode-toggle";
import { StaffManager } from "./staff-manager";

export default async function StaffPage() {
  const { shopId } = await requireAdmin();
  const [staff, shop] = await Promise.all([
    listStaff(shopId),
    getShopById(shopId),
  ]);

  if (!shop) return null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-base font-semibold">Thợ</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý thợ và chế độ doanh thu.
        </p>
      </div>

      <RevenueModeToggle mode={shop.revenueMode as "per_staff" | "combined"} />
      <StaffManager
        staff={staff}
        showCommission={shop.revenueMode !== "combined"}
      />
    </div>
  );
}
