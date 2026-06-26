"use client";

import { cn } from "@/lib/utils";
import type { PublicService } from "./types";

const vnd = new Intl.NumberFormat("vi-VN");

interface ServicePickerProps {
  services: PublicService[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

function formatPrice(price: number): string {
  return vnd.format(price) + "đ";
}

export function ServicePicker({ services, selectedIds, onToggle }: ServicePickerProps) {
  // Group by category; null → "Khác"
  const groups = new Map<string, PublicService[]>();
  for (const s of services) {
    const key = s.category ?? "Khác";
    const arr = groups.get(key) ?? [];
    arr.push(s);
    groups.set(key, arr);
  }

  return (
    <section className="px-4">
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Chọn dịch vụ
      </h2>
      <div className="flex flex-col gap-4">
        {Array.from(groups.entries()).map(([category, items]) => (
          <div key={category}>
            <p className="mb-2 text-xs font-medium text-muted-foreground">{category}</p>
            <div className="flex flex-col gap-2">
              {items.map((service) => {
                const selected = selectedIds.includes(service.id);
                return (
                  <button
                    key={service.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onToggle(service.id)}
                    className={cn(
                      "flex min-h-[56px] w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                      selected
                        ? "border-[var(--accent)] bg-[var(--accent)]/10"
                        : "border-border bg-card hover:bg-muted/50"
                    )}
                  >
                    {/* Selection indicator */}
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        selected
                          ? "border-[var(--accent)] bg-[var(--accent)]"
                          : "border-muted-foreground/40"
                      )}
                    >
                      {selected && (
                        <svg
                          width="10"
                          height="8"
                          viewBox="0 0 10 8"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M1 4l3 3 5-6"
                            stroke="white"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>

                    <span className="flex-1 min-w-0">
                      <span className="block font-medium text-sm leading-snug">{service.name}</span>
                      {service.description && (
                        <span className="block text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {service.description}
                        </span>
                      )}
                      <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span
                          className={cn("font-semibold", selected && "text-[var(--accent)]")}
                        >
                          {formatPrice(service.price)}
                        </span>
                        <span>·</span>
                        <span>{service.durationMin} phút</span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
