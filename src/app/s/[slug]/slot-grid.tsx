"use client";

import { cn } from "@/lib/utils";
import { formatLocal } from "@/lib/tz";

interface SlotGridProps {
  slots: string[]; // ISO UTC strings
  selected: string | null;
  loading: boolean;
  onSelect: (slot: string) => void;
}

export function SlotGrid({ slots, selected, loading, onSelect }: SlotGridProps) {
  if (loading) {
    return (
      <section className="px-4">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Chọn giờ
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded-lg bg-muted"
              aria-hidden="true"
            />
          ))}
        </div>
      </section>
    );
  }

  if (slots.length === 0) {
    return (
      <section className="px-4">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Chọn giờ
        </h2>
        <p className="rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
          Hết chỗ hoặc ngày nghỉ — chọn ngày khác
        </p>
      </section>
    );
  }

  return (
    <section className="px-4">
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Chọn giờ
      </h2>
      <div className="grid grid-cols-4 gap-2">
        {slots.map((iso) => {
          const label = formatLocal(new Date(iso), "HH:mm");
          const isSelected = iso === selected;
          return (
            <button
              key={iso}
              type="button"
              aria-pressed={isSelected}
              aria-label={`Chọn giờ ${label}`}
              onClick={() => onSelect(iso)}
              className={cn(
                "flex h-10 items-center justify-center rounded-lg border text-sm font-medium transition-colors",
                isSelected
                  ? "border-[var(--accent)] text-white"
                  : "border-border bg-card hover:bg-muted/60 text-foreground"
              )}
              style={
                isSelected
                  ? { backgroundColor: "var(--accent)", borderColor: "var(--accent)" }
                  : undefined
              }
            >
              {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
