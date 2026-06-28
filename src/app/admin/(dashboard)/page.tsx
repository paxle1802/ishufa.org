import { requireAdmin } from "@/lib/auth/require-admin";
import { listBookingsForDay } from "@/lib/booking/queries";
import { getFinanceSummary, listExpensesForDay } from "@/lib/db/queries-finance";
import { listOverdueArrived } from "@/lib/db/queries-dashboard";
import { dayRange } from "@/lib/tz";

import { DailyMoney } from "./daily-money";
import { ExpenseManager } from "./expenses/expense-manager";
import { OverdueArrivedAlert } from "./overdue-arrived-alert";
import { TodayAppointments } from "./today-appointments";

function todayVn(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Saigon" }).format(new Date());
}

/** Dashboard "Hôm nay": bảng tiền (thu/chi/lãi) + kê khai chi phí + lịch hẹn. */
export default async function AdminTodayPage() {
  const { shopId } = await requireAdmin();
  const day = todayVn();
  const month = day.slice(0, 7);

  const todayStart = dayRange(day).from;
  const [summary, expenseRows, bookings, overdue] = await Promise.all([
    getFinanceSummary(shopId, day, month),
    listExpensesForDay(shopId, day),
    listBookingsForDay(shopId, day),
    listOverdueArrived(shopId, todayStart),
  ]);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">Hôm nay</h1>

      {/* Nhắc đóng đơn "Đang làm" còn sót từ ngày trước */}
      <OverdueArrivedAlert bookings={overdue} />

      {/* Bảng tiền: Doanh thu / Chi phí / Lợi nhuận (Hôm nay ↔ Tháng này) */}
      <DailyMoney day={summary.day} month={summary.month} />

      {/* Kê khai chi phí trong ngày */}
      <div>
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
          Chi phí hôm nay
        </h2>
        <ExpenseManager
          expenses={expenseRows.map((e) => ({ id: e.id, amount: e.amount, note: e.note }))}
        />
      </div>

      {/* Lịch hẹn hôm nay — chỉ đọc, thao tác ở tab Bookings */}
      <div>
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
          Lịch hẹn hôm nay ({bookings.filter((b) => b.status !== "cancelled").length})
        </h2>
        <TodayAppointments bookings={bookings} />
      </div>
    </div>
  );
}
