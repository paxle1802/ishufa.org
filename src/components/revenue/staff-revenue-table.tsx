import type { StaffRevenueReport } from "@/lib/revenue/staff-revenue";

const vnd = new Intl.NumberFormat("vi-VN");

function fmt(amount: number) {
  return vnd.format(amount) + "đ";
}

interface Props {
  report: StaffRevenueReport;
  /** Gộp: chỉ hiện tổng, không tách theo thợ. */
  combined?: boolean;
}

export function StaffRevenueTable({ report, combined = false }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold text-foreground">
          {combined ? "Doanh thu" : "Doanh thu theo thợ"}
        </h2>
        <span className="text-xs text-muted-foreground">
          {report.bookingCount} booking
        </span>
      </div>

      <div className="rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-2.5 bg-muted/30">
          <span className="text-xs text-muted-foreground">Tổng</span>
          <span className="font-semibold text-sm">{fmt(report.total)}</span>
        </div>

        {combined ? null : report.rows.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="font-heading text-3xl font-semibold text-foreground">0đ</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Chưa có doanh thu trong kỳ này
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {report.rows.map((row, i) => (
              <li
                key={row.staffId ?? `unassigned-${i}`}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{row.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.itemCount} dịch vụ
                  </p>
                </div>
                <span className="font-bold text-sm tabular-nums">
                  {fmt(row.revenue)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
