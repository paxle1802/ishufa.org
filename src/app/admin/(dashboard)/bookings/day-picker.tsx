"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

/** Dịch chuyển "yyyy-MM-dd" n ngày (tính ở noon UTC tránh lệch DST). */
function shift(date: string, n: number): string {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function DayPicker({ date }: { date: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const go = (d: string) => router.push(`${pathname}?date=${d}`);

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => go(shift(date, -1))} aria-label="Ngày trước">
        <ChevronLeft className="size-4" />
      </Button>
      <input
        type="date"
        value={date}
        onChange={(e) => e.target.value && go(e.target.value)}
        className="h-9 flex-1 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      />
      <Button variant="outline" size="icon" onClick={() => go(shift(date, 1))} aria-label="Ngày sau">
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
