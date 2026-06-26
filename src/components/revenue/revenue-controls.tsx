"use client";

import { useRouter, usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  period: "day" | "month";
  date: string;
}

export function RevenueControls({ period, date }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function push(p: "day" | "month", d: string) {
    const params = new URLSearchParams({ period: p, date: d });
    router.push(`${pathname}?${params.toString()}`);
  }

  function handlePeriodToggle(p: "day" | "month") {
    if (p === period) return;
    // Reset date to current when switching period
    const now = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Saigon",
    }).format(new Date());
    const newDate = p === "month" ? now.slice(0, 7) : now;
    push(p, newDate);
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    push(period, e.target.value);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1 rounded-full bg-muted p-0.5">
        <Button
          size="sm"
          variant={period === "month" ? "default" : "ghost"}
          className={cn("rounded-full", period !== "month" && "text-muted-foreground")}
          onClick={() => handlePeriodToggle("month")}
        >
          Tháng
        </Button>
        <Button
          size="sm"
          variant={period === "day" ? "default" : "ghost"}
          className={cn("rounded-full", period !== "day" && "text-muted-foreground")}
          onClick={() => handlePeriodToggle("day")}
        >
          Ngày
        </Button>
      </div>

      <input
        suppressHydrationWarning
        type={period === "month" ? "month" : "date"}
        value={date}
        onChange={handleDateChange}
        className="h-8 rounded-lg border border-input bg-card px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
      />
    </div>
  );
}
