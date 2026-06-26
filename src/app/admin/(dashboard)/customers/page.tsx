import { requireAdmin } from "@/lib/auth/require-admin";
import { listCustomers } from "@/lib/db/queries-customers";
import { CustomerList } from "./customer-list";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { shopId } = await requireAdmin();
  const { q } = await searchParams;
  const search = q?.trim() || undefined;

  const customers = await listCustomers(shopId, { search });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Khách hàng</h1>
        <p className="text-sm text-muted-foreground">{customers.length} khách</p>
      </div>
      <CustomerList customers={customers} q={q ?? ""} />
    </div>
  );
}
