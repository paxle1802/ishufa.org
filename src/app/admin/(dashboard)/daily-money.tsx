"use client";

import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PnL } from "@/lib/db/queries-finance";

const vnd = new Intl.NumberFormat("vi-VN");

/** Thẻ tiền Hôm nay: Doanh thu / Chi phí / Lợi nhuận, đổi Ngày ↔ Tháng. */
export function DailyMoney({ day, month }: { day: PnL; month: PnL }) {
  const [scope, setScope] = useState<"day" | "month">("day");
  const pnl = scope === "day" ? day : month;
  const profitPositive = pnl.profit >= 0;

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        {/* Toggle Ngày | Tháng */}
        <div className="flex gap-2">
          {(["day", "month"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScope(s)}
              className={cn(
                "rounded-full px-3 py-1 text-sm font-semibold transition-colors",
                scope === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {s === "day" ? "Hôm nay" : "Tháng này"}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Doanh thu</span>
          <span className="font-semibold">{vnd.format(pnl.revenue)}đ</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Chi phí</span>
          <span className="font-semibold">−{vnd.format(pnl.expense)}đ</span>
        </div>
        <div className="flex items-center justify-between border-t pt-2.5">
          <span className="text-sm font-medium">Lợi nhuận</span>
          <span
            className={cn(
              "font-heading text-2xl font-semibold",
              profitPositive ? "text-emerald-600" : "text-red-600",
            )}
          >
            {vnd.format(pnl.profit)}đ
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
