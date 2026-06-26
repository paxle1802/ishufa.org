import {
  getActivePackagesForPhones,
  listBookingsForDay,
} from "@/lib/booking/queries";
import { getTodayStats } from "@/lib/db/queries-dashboard";
import { requireAdmin } from "@/lib/auth/require-admin";
import { Card, CardContent } from "@/components/ui/card";
import type { ActivePackage } from "./bookings/booking-status-control";
import { BookingList } from "./bookings/booking-list";

const vnd = new Intl.NumberFormat("vi-VN");

function todayVn(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Saigon" }).format(new Date());
}

/** Dashboard "Hôm nay": thống kê nhanh + lịch hẹn trong ngày. */
export default async function AdminTodayPage() {
  const { shopId } = await requireAdmin();
  const day = todayVn();

  const [bookings, stats] = await Promise.all([
    listBookingsForDay(shopId, day),
    getTodayStats(shopId, day),
  ]);

  const rows = await getActivePackagesForPhones(
    shopId,
    [...new Set(bookings.map((b) => b.customerPhone))],
  );
  const packagesByPhone: Record<string, ActivePackage[]> = {};
  for (const r of rows) {
    (packagesByPhone[r.phone] ??= []).push({
      id: r.id,
      name: r.name,
      sessionsRemaining: r.sessionsRemaining,
    });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Hôm nay</h1>

      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Doanh thu" value={`${vnd.format(stats.revenue)}đ`} />
        <StatCard label="Lịch hẹn" value={String(stats.bookingsToday)} />
        <StatCard label="KM chạy" value={String(stats.activePromos)} />
      </div>

      <BookingList bookings={bookings} packagesByPhone={packagesByPhone} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-3 text-center">
        <p className="truncate text-base font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
