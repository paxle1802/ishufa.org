import { requireAdmin } from "@/lib/auth/require-admin";
import { listStaff } from "@/lib/db/queries-staff";

import { StaffManager } from "./staff-manager";

export default async function StaffPage() {
  const { shopId } = await requireAdmin();
  const staff = await listStaff(shopId);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-base font-semibold">Thợ</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý thợ và cách tính lương (lương cứng + ăn chia %).
        </p>
      </div>

      <StaffManager staff={staff} />
    </div>
  );
}
