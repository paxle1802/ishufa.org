import { autoCancelStaleBookings } from "@/lib/booking/auto-cancel";
import { listBookingsForDay } from "@/lib/booking/queries";
import { getTodayStats } from "@/lib/db/queries-dashboard";
import { requireAdmin } from "@/lib/auth/require-admin";
import { Card, CardContent } from "@/components/ui/card";
import { TodayAppointments } from "./today-appointments";

const vnd = new Intl.NumberFormat("vi-VN");

function todayVn(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Saigon" }).format(new Date());
}

/** Dashboard "Hôm nay": thống kê chung + danh sách lịch hẹn (chỉ đọc). */
export default async function AdminTodayPage() {
  const { shopId } = await requireAdmin();
  const day = todayVn();

  await autoCancelStaleBookings(shopId); // tự huỷ no-show quá giờ ân hạn
  const [bookings, stats] = await Promise.all([
    listBookingsForDay(shopId, day),
    getTodayStats(shopId, day),
  ]);

  const done = bookings.filter((b) => b.status === "completed").length;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">Hôm nay</h1>

      {/* Thống kê chung */}
      <div className="grid grid-cols-2 gap-2.5">
        <StatCard label="Doanh thu" value={`${vnd.format(stats.revenue)}đ`} />
        <StatCard label="Lịch hẹn" value={String(stats.bookingsToday)} />
        <StatCard label="Đã thu tiền" value={String(done)} />
        <StatCard label="KM đang chạy" value={String(stats.activePromos)} />
      </div>

      {/* Lịch hẹn hôm nay — chỉ đọc, thao tác nằm ở tab Bookings */}
      <div>
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
          Lịch hẹn hôm nay
        </h2>
        <TodayAppointments bookings={bookings} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="font-heading truncate text-2xl font-semibold">{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
