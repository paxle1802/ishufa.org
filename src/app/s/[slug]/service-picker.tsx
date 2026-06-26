"use client";

import { cn } from "@/lib/utils";
import type { PublicService } from "./types";

const vnd = new Intl.NumberFormat("vi-VN");

// Bảng màu thẻ (nền trong suốt) — luân phiên theo thứ tự dịch vụ.
const PALETTE = [
  { bg: "bg-rose-500/10", border: "border-rose-400/40", text: "text-rose-600", dot: "bg-rose-500", ring: "ring-rose-500" },
  { bg: "bg-amber-500/10", border: "border-amber-400/40", text: "text-amber-600", dot: "bg-amber-500", ring: "ring-amber-500" },
  { bg: "bg-emerald-500/10", border: "border-emerald-400/40", text: "text-emerald-600", dot: "bg-emerald-500", ring: "ring-emerald-500" },
  { bg: "bg-sky-500/10", border: "border-sky-400/40", text: "text-sky-600", dot: "bg-sky-500", ring: "ring-sky-500" },
  { bg: "bg-violet-500/10", border: "border-violet-400/40", text: "text-violet-600", dot: "bg-violet-500", ring: "ring-violet-500" },
  { bg: "bg-fuchsia-500/10", border: "border-fuchsia-400/40", text: "text-fuchsia-600", dot: "bg-fuchsia-500", ring: "ring-fuchsia-500" },
  { bg: "bg-teal-500/10", border: "border-teal-400/40", text: "text-teal-600", dot: "bg-teal-500", ring: "ring-teal-500" },
  { bg: "bg-orange-500/10", border: "border-orange-400/40", text: "text-orange-600", dot: "bg-orange-500", ring: "ring-orange-500" },
];

interface ServicePickerProps {
  services: PublicService[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

const formatPrice = (price: number) => vnd.format(price) + "đ";

export function ServicePicker({ services, selectedIds, onToggle }: ServicePickerProps) {
  return (
    <section className="px-4">
      <h2 className="mb-3 text-lg font-bold tracking-wide text-foreground">Chọn dịch vụ</h2>
      <div className="grid grid-cols-2 gap-3">
        {services.map((service, i) => {
          const selected = selectedIds.includes(service.id);
          const c = PALETTE[i % PALETTE.length];
          return (
            <button
              key={service.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onToggle(service.id)}
              className={cn(
                "relative flex min-h-[128px] flex-col rounded-2xl border p-4 text-left backdrop-blur-sm transition-all",
                c.bg,
                c.border,
                selected && cn("ring-2 ring-offset-2", c.ring),
              )}
            >
              {/* dấu chọn */}
              {selected && (
                <span
                  className={cn(
                    "absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full",
                    c.dot,
                  )}
                >
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden>
                    <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}

              {/* tên dịch vụ — chữ to chiếm phần trên */}
              <span className={cn("pr-7 text-xl font-extrabold leading-tight", c.text)}>
                {service.name}
              </span>

              {/* giá + thời gian ở đáy thẻ */}
              <span className="mt-auto pt-3">
                <span className="block text-lg font-bold text-foreground">
                  {formatPrice(service.price)}
                </span>
                <span className="block text-sm text-muted-foreground">
                  ~ {service.durationMin} phút
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
