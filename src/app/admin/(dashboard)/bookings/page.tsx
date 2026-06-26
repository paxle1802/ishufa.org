import { listBookingsForDay } from "@/lib/booking/queries";
import { requireAdmin } from "@/lib/auth/require-admin";
import { BookingList } from "./booking-list";
import { DayPicker } from "./day-picker";

function todayVn(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Saigon" }).format(new Date());
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { shopId } = await requireAdmin();
  const { date } = await searchParams;
  const day = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayVn();

  const bookings = await listBookingsForDay(shopId, day);
  const active = bookings.filter((b) => b.status !== "cancelled").length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Lịch hẹn</h1>
        <p className="text-sm text-muted-foreground">{active} lịch trong ngày</p>
      </div>
      <DayPicker date={day} />
      <BookingList bookings={bookings} />
    </div>
  );
}
