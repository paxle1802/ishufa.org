import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { RevenueControls } from "@/components/revenue/revenue-controls";
import { StaffRevenueTable } from "@/components/revenue/staff-revenue-table";
import { requireSuperAdmin } from "@/lib/auth/require-admin";
import { getShopById, listAllServices } from "@/lib/db/queries";
import { listStaff } from "@/lib/db/queries-staff";
import { getStaffRevenue } from "@/lib/revenue/staff-revenue";
import { dayRange, monthRange } from "@/lib/tz";
import { ServiceStaffMap } from "./service-staff-map";
import { StaffManager } from "./staff-manager";

interface Props {
  params: Promise<{ shopId: string }>;
  searchParams: Promise<{ period?: string; date?: string }>;
}

function todayVN() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Saigon" }).format(
    new Date(),
  );
}

function thisMonthVN() {
  return todayVN().slice(0, 7);
}

export default async function SuperShopPage({ params, searchParams }: Props) {
  await requireSuperAdmin();

  const { shopId } = await params;
  const { period: rawPeriod, date: rawDate } = await searchParams;

  const shop = await getShopById(shopId);
  if (!shop) notFound();

  const [staffList, services] = await Promise.all([
    listStaff(shopId),
    listAllServices(shopId),
  ]);

  const period = rawPeriod === "day" ? "day" : "month";
  const date =
    rawDate ?? (period === "month" ? thisMonthVN() : todayVN());

  const range = period === "month" ? monthRange(date) : dayRange(date);
  const report = await getStaffRevenue(shopId, range.from, range.to);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link
          href="/super"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Danh sách salon
        </Link>
      </div>

      <h1 className="text-lg font-semibold">{shop.name}</h1>

      <StaffManager shopId={shopId} staff={staffList} />
      <ServiceStaffMap shopId={shopId} services={services} staff={staffList} />

      <div className="space-y-3">
        <RevenueControls period={period} date={date} />
        <StaffRevenueTable report={report} />
      </div>
    </div>
  );
}
