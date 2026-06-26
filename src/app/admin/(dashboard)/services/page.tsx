import { requireAdmin } from "@/lib/auth/require-admin";
import { listAllServices } from "@/lib/db/queries";
import { listStaff } from "@/lib/db/queries-staff";
import { ServicesManager } from "./services-manager";

export default async function ServicesPage() {
  const { shopId } = await requireAdmin();
  const [services, staff] = await Promise.all([
    listAllServices(shopId),
    listStaff(shopId),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Dịch vụ</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý danh mục dịch vụ của salon.
        </p>
      </div>
      <ServicesManager
        services={services}
        staff={staff.map((s) => ({ id: s.id, name: s.name }))}
      />
    </div>
  );
}
