import { listBookingsForDay } from "@/lib/booking/queries";
import { requireAdmin } from "@/lib/auth/require-admin";
import { BookingList } from "./bookings/booking-list";

function todayVn(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Saigon" }).format(new Date());
}

/** Dashboard "Hôm nay": lịch hẹn trong ngày của shop. */
export default async function AdminTodayPage() {
  const { shopId } = await requireAdmin();
  const day = todayVn();
  const bookings = await listBookingsForDay(shopId, day);

  const active = bookings.filter((b) => b.status !== "cancelled");
  const now = Date.now();
  // Nhắc grace: booking confirmed đã qua giờ bắt đầu (khách có thể đang trễ).
  const late = active.filter(
    (b) => b.status === "confirmed" && b.startAt.getTime() < now,
  ).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Hôm nay</h1>
        <p className="text-sm text-muted-foreground">
          {active.length} lịch hẹn{late > 0 ? ` · ${late} đã tới/quá giờ` : ""}
        </p>
      </div>
      <BookingList bookings={bookings} />
    </div>
  );
}
