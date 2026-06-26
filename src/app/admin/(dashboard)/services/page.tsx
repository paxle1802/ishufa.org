import { requireAdmin } from "@/lib/auth/require-admin";
import { listAllServices } from "@/lib/db/queries";
import { ServicesManager } from "./services-manager";

export default async function ServicesPage() {
  const { shopId } = await requireAdmin();
  const services = await listAllServices(shopId);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Dịch vụ</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý danh mục dịch vụ của salon.
        </p>
      </div>
      <ServicesManager services={services} />
    </div>
  );
}
