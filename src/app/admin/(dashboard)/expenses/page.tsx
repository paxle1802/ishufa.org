import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getFinanceSummary, listExpensesForDay, type PnL } from "@/lib/db/queries-finance";
import { ExpenseManager } from "./expense-manager";

const vnd = new Intl.NumberFormat("vi-VN");

function todayVn(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Saigon" }).format(new Date());
}

/** Cài đặt → Chi phí & Lợi nhuận: kê khai chi phí + lợi nhuận ngày/tháng. */
export default async function ExpensesPage() {
  const { shopId } = await requireAdmin();
  const day = todayVn();
  const month = day.slice(0, 7);

  const [summary, expenseRows] = await Promise.all([
    getFinanceSummary(shopId, day, month),
    listExpensesForDay(shopId, day),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Chi phí &amp; Lợi nhuận</h1>
        <p className="text-sm text-muted-foreground">
          Kê khai chi phí và theo dõi lợi nhuận theo ngày / tháng.
        </p>
      </div>

      <PnLCard title="Hôm nay" pnl={summary.day} />
      <PnLCard title="Tháng này" pnl={summary.month} />

      <div>
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
          Chi phí hôm nay
        </h2>
        <ExpenseManager
          expenses={expenseRows.map((e) => ({ id: e.id, amount: e.amount, note: e.note }))}
        />
      </div>
    </div>
  );
}

function PnLCard({ title, pnl }: { title: string; pnl: PnL }) {
  const profitPositive = pnl.profit >= 0;
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">{title}</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Doanh thu</span>
          <span className="font-semibold">{vnd.format(pnl.revenue)}đ</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Chi phí</span>
          <span className="font-semibold">−{vnd.format(pnl.expense)}đ</span>
        </div>
        <div className="flex items-center justify-between border-t pt-2">
          <span className="text-sm font-medium">Lợi nhuận</span>
          <span
            className={`font-heading text-xl font-semibold ${
              profitPositive ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {vnd.format(pnl.profit)}đ
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
