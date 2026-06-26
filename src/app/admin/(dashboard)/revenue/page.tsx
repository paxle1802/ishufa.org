import { RevenueControls } from "@/components/revenue/revenue-controls";
import { StaffRevenueTable } from "@/components/revenue/staff-revenue-table";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getStaffRevenue } from "@/lib/revenue/staff-revenue";
import { dayRange, monthRange } from "@/lib/tz";

interface Props {
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

export default async function AdminRevenuePage({ searchParams }: Props) {
  const { shopId } = await requireAdmin();
  const { period: rawPeriod, date: rawDate } = await searchParams;

  const period = rawPeriod === "day" ? "day" : "month";
  const date = rawDate ?? (period === "month" ? thisMonthVN() : todayVN());

  const range = period === "month" ? monthRange(date) : dayRange(date);
  const report = await getStaffRevenue(shopId, range.from, range.to);

  return (
    <div className="space-y-4">
      <RevenueControls period={period} date={date} />
      <StaffRevenueTable report={report} />
    </div>
  );
}
