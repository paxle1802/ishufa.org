"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { formatLocal } from "@/lib/tz";

const VN_WEEKDAY = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

interface DateStripProps {
  selected: string; // yyyy-MM-dd
  maxAdvanceDays: number;
  onSelect: (date: string) => void;
}

/**
 * Generate yyyy-MM-dd strings starting from today (Asia/Saigon).
 * Arithmetic is done on the date string parts to avoid UTC-offset bugs.
 */
function addDays(yyyy_mm_dd: string, n: number): string {
  // Parse as noon UTC to avoid any DST shift crossing midnight
  const d = new Date(yyyy_mm_dd + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function buildDates(maxAdvanceDays: number): string[] {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Saigon" }).format(new Date());
  const cap = Math.min(maxAdvanceDays, 30);
  const dates: string[] = [];
  for (let i = 0; i < cap; i++) {
    dates.push(addDays(today, i));
  }
  return dates;
}

export function DateStrip({ selected, maxAdvanceDays, onSelect }: DateStripProps) {
  const dates = buildDates(maxAdvanceDays);
  const selectedRef = useRef<HTMLButtonElement | null>(null);

  // Scroll selected chip into view on mount
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
  }, [selected]);

  return (
    <section className="px-4">
      <h2 className="mb-3 text-base font-bold tracking-wide text-foreground">
        Chọn ngày
      </h2>
      <div className="overflow-x-auto pb-1 -mx-4 px-4">
        <div className="flex gap-2" style={{ width: "max-content" }}>
          {dates.map((dateStr) => {
            // Use noon UTC so getDay() gives the correct VN weekday regardless of browser TZ
            const d = new Date(dateStr + "T12:00:00Z");
            const weekday = VN_WEEKDAY[d.getUTCDay()];
            const dayMonth = formatLocal(d, "dd/MM");
            const isSelected = dateStr === selected;

            return (
              <button
                key={dateStr}
                type="button"
                ref={isSelected ? selectedRef : null}
                aria-pressed={isSelected}
                aria-label={`${weekday} ${dayMonth}`}
                onClick={() => onSelect(dateStr)}
                className={cn(
                  "flex min-h-[60px] min-w-[56px] flex-col items-center justify-center rounded-xl border px-2.5 py-2 transition-colors",
                  isSelected
                    ? "border-[var(--accent)] text-white"
                    : "border-border glass text-foreground hover:bg-muted/60"
                )}
                style={isSelected ? { backgroundColor: "var(--accent)", borderColor: "var(--accent)" } : undefined}
              >
                <span className="text-xs font-semibold leading-none opacity-90">{weekday}</span>
                <span className="mt-1 text-base font-bold leading-none">{dayMonth}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
