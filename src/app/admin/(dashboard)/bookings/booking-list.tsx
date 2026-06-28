"use client";

import { useEffect, useState } from "react";
import { Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { BookingStatus } from "@/lib/db/schema";
import { formatLocal } from "@/lib/tz";
import { cn } from "@/lib/utils";
import type { BookingForDay } from "@/lib/booking/queries";
import { BookingStatusControl, type ActivePackage } from "./booking-status-control";

const vnd = new Intl.NumberFormat("vi-VN");

/** Tài khoản nhận tiền của shop (đã cấu hình đủ). */
export interface ShopBank {
  bankBin: string;
  accountNumber: string;
  accountName: string;
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  confirmed: "Đã đặt chỗ",
  arrived: "Đang làm",
  completed: "Đã thanh toán",
  cancelled: "Huỷ",
};
const STATUS_CLASS: Record<BookingStatus, string> = {
  confirmed: "bg-blue-100 text-blue-700",
  arrived: "bg-violet-100 text-violet-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-muted-foreground/20 text-muted-foreground",
};
// Thẻ kính pha màu theo trạng thái (crystal trong suốt).
const STATUS_CARD: Record<BookingStatus, string> = {
  confirmed: "glass-tint glass-blue",
  arrived: "glass-tint glass-violet",
  completed: "glass-tint glass-green",
  cancelled: "border-muted-foreground/20 bg-muted/70 text-muted-foreground",
};

export function BookingList({
  bookings,
  packagesByPhone = {},
  bank = null,
}: {
  bookings: BookingForDay[];
  packagesByPhone?: Record<string, ActivePackage[]>;
  bank?: ShopBank | null;
}) {
  if (bookings.length === 0) {
    return (
      <p className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
        Chưa có lịch hẹn nào trong ngày này.
      </p>
    );
  }

  const now = Date.now();

  // Khi mở từ link "#b-<id>" (cảnh báo Hôm nay) → cuộn tới đúng đơn + nháy sáng.
  const [highlightId, setHighlightId] = useState<string | null>(null);
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#b-")) return;
    const elemId = hash.slice(1);
    const el = document.getElementById(elemId);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    setHighlightId(elemId);
    const t = setTimeout(() => setHighlightId(null), 2600);
    return () => clearTimeout(t);
  }, []);

  return (
    <ul className="flex flex-col gap-3">
      {bookings.map((b) => {
        const isCancelled = b.status === "cancelled";
        const isNow =
          !isCancelled &&
          now >= b.startAt.getTime() &&
          now < b.endAt.getTime();
        const highlighted = highlightId === `b-${b.id}`;
        return (
        <li
          key={b.id}
          id={`b-${b.id}`}
          className={cn(
            "scroll-mt-20 rounded-xl border p-3 transition-shadow",
            STATUS_CARD[b.status],
            isNow && "ring-2 ring-primary",
            highlighted && "ring-2 ring-amber-500 ring-offset-2",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold">
                {formatLocal(b.startAt, "HH:mm")}–{formatLocal(b.endAt, "HH:mm")}
                {isNow && (
                  <span className="ml-2 align-middle text-xs font-bold text-primary">
                    ● Đang diễn ra
                  </span>
                )}
              </p>
              <p className="truncate text-sm">{b.customerName}</p>
              <a
                href={`tel:${b.customerPhone}`}
                className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground"
              >
                <Phone className="size-3.5" aria-hidden /> {b.customerPhone}
              </a>
            </div>
            <Badge className={cn("shrink-0", STATUS_CLASS[b.status])}>
              {STATUS_LABEL[b.status]}
            </Badge>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            {b.items.map((it) => it.service.name).join(", ")}
          </p>

          {b.note && (
            <p className="mt-1 text-sm italic text-muted-foreground">“{b.note}”</p>
          )}

          <div className="mt-3 flex items-center justify-end">
            <span className="text-base font-bold">{vnd.format(b.totalPrice)}đ</span>
          </div>

          <div className="mt-3">
            <BookingStatusControl
              bookingId={b.id}
              status={b.status}
              amount={b.totalPrice}
              addInfo={`TT ${b.id.slice(0, 8).toUpperCase()}`}
              bank={bank}
              activePackages={packagesByPhone[b.customerPhone] ?? []}
            />
          </div>
        </li>
        );
      })}
    </ul>
  );
}
