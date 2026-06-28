"use client";

import { useRouter, usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Period = "day" | "month" | "year";

interface Props {
  period: Period;
  date: string;
  /** Năm để chọn: từ năm shop onboard → năm hiện tại (mới nhất trước). */
  years?: number[];
}

const PERIODS: { value: Period; label: string }[] = [
  { value: "year", label: "Năm" },
  { value: "month", label: "Tháng" },
  { value: "day", label: "Ngày" },
];

export function RevenueControls({ period, date, years = [] }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function push(p: Period, d: string) {
    const params = new URLSearchParams({ period: p, date: d });
    router.push(`${pathname}?${params.toString()}`);
  }

  function handlePeriodToggle(p: Period) {
    if (p === period) return;
    // Reset date to current when switching period
    const now = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Saigon",
    }).format(new Date());
    const newDate =
      p === "year" ? now.slice(0, 4) : p === "month" ? now.slice(0, 7) : now;
    push(p, newDate);
  }

  function handleDateChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const v = e.target.value;
    if (!v) return; // bỏ qua khi ô trống (đang gõ dở) → tránh date rỗng
    push(period, v);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1 rounded-full bg-muted p-0.5">
        {PERIODS.map((p) => (
          <Button
            key={p.value}
            size="sm"
            variant={period === p.value ? "default" : "ghost"}
            className={cn("rounded-full", period !== p.value && "text-muted-foreground")}
            onClick={() => handlePeriodToggle(p.value)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {period === "year" ? (
        <select
          value={date}
          onChange={handleDateChange}
          className="h-8 rounded-lg border border-input bg-card px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {years.map((y) => (
            <option key={y} value={String(y)}>
              Năm {y}
            </option>
          ))}
        </select>
      ) : (
        <input
          suppressHydrationWarning
          type={period === "month" ? "month" : "date"}
          value={date}
          onChange={handleDateChange}
          className="h-8 rounded-lg border border-input bg-card px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
        />
      )}
    </div>
  );
}
