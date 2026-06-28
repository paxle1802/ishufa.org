import { RevenueControls } from "@/components/revenue/revenue-controls";
import { StaffRevenueTable } from "@/components/revenue/staff-revenue-table";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getShopById } from "@/lib/db/queries";
import { getStaffRevenue } from "@/lib/revenue/staff-revenue";
import { dayRange, formatLocal, monthRange, yearRange } from "@/lib/tz";

type Period = "day" | "month" | "year";

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

  const period: Period =
    rawPeriod === "day" ? "day" : rawPeriod === "year" ? "year" : "month";

  // Validate date theo đúng định dạng của kỳ; sai/trống → dùng kỳ hiện tại.
  // Tránh ngày không hợp lệ (vd ô năm bị xoá trống) lọt vào range → query lỗi.
  const PATTERN: Record<Period, RegExp> = {
    year: /^\d{4}$/,
    month: /^\d{4}-\d{2}$/,
    day: /^\d{4}-\d{2}-\d{2}$/,
  };
  const defaultDate =
    period === "year" ? todayVN().slice(0, 4) : period === "month" ? thisMonthVN() : todayVN();
  const date = rawDate && PATTERN[period].test(rawDate) ? rawDate : defaultDate;

  const range =
    period === "year"
      ? yearRange(date)
      : period === "month"
        ? monthRange(date)
        : dayRange(date);
  // Báo cáo Doanh thu luôn chia theo thợ (không phụ thuộc chế độ Gộp).
  const [report, shop] = await Promise.all([
    getStaffRevenue(shopId, range.from, range.to),
    getShopById(shopId),
  ]);

  // Danh sách năm để chọn: từ năm shop onboard → năm hiện tại (mới nhất trước).
  const currentYear = Number(todayVN().slice(0, 4));
  const onboardYear = shop ? Number(formatLocal(shop.createdAt, "yyyy")) : currentYear;
  const years: number[] = [];
  for (let y = currentYear; y >= Math.min(onboardYear, currentYear); y--) years.push(y);

  return (
    <div className="space-y-4">
      <RevenueControls period={period} date={date} years={years} />
      <StaffRevenueTable report={report} />
    </div>
  );
}
