"use client";

import { cn } from "@/lib/utils";
import type { PublicService } from "./types";

const vnd = new Intl.NumberFormat("vi-VN");
const formatPrice = (price: number) => vnd.format(price) + "đ";

// Bộ màu kính crystal — mỗi dịch vụ một tông trong suốt khác nhau cho dễ phân biệt.
const TINTS = ["glass-blue", "glass-violet", "glass-green"];

interface ServicePickerProps {
  services: PublicService[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export function ServicePicker({ services, selectedIds, onToggle }: ServicePickerProps) {
  return (
    <section className="px-4">
      <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
        Chọn dịch vụ
      </h2>
      <div className="flex flex-col gap-3">
        {services.map((service, i) => {
          const selected = selectedIds.includes(service.id);
          return (
            <button
              key={service.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onToggle(service.id)}
              className={cn(
                // 1 dịch vụ / 1 hàng, cao bằng nhau. Mỗi thẻ một tông kính crystal.
                // Chữ bên trái, ảnh minh hoạ bên phải.
                "relative flex min-h-[92px] w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all",
                selected
                  ? "border-primary ring-2 ring-primary glass-tint " + TINTS[i % TINTS.length]
                  : "glass-tint " + TINTS[i % TINTS.length] + " hover:brightness-[1.03]",
              )}
            >
              {selected && (
                <span
                  className="absolute left-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary shadow"
                  aria-hidden
                >
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                    <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}

              {/* Cột chữ */}
              <span className={cn("flex min-w-0 flex-1 flex-col", selected && "pl-7")}>
                {/* Tên dịch vụ — chữ to */}
                <span className="text-lg font-bold leading-snug text-foreground">
                  {service.name}
                </span>
                {/* Giá + thời gian ước tính */}
                <span className="mt-1 flex items-baseline gap-2">
                  <span className="text-base font-bold text-foreground">
                    {formatPrice(service.price)}
                  </span>
                  <span className="text-sm text-muted-foreground">· ~ {service.durationMin} phút</span>
                </span>
              </span>

              {/* Ảnh minh hoạ bên phải */}
              {service.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={service.imageUrl}
                  alt={service.name}
                  className="h-20 w-20 shrink-0 rounded-xl object-cover ring-1 ring-foreground/10"
                  loading="lazy"
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
