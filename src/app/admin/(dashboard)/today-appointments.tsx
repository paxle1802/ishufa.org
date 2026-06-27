import { Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { BookingForDay } from "@/lib/booking/queries";
import type { BookingStatus } from "@/lib/db/schema";
import { formatLocal } from "@/lib/tz";
import { cn } from "@/lib/utils";

const vnd = new Intl.NumberFormat("vi-VN");

// confirmed = đã đặt (chưa tới) · arrived = đang làm · completed = đã thu tiền · cancelled = huỷ.
const BADGE: Record<BookingStatus, { label: string; cls: string }> = {
  confirmed: { label: "Đã đặt", cls: "bg-blue-100 text-blue-700" },
  arrived: { label: "Đang làm", cls: "bg-violet-100 text-violet-700" },
  completed: { label: "Đã thu tiền", cls: "bg-green-100 text-green-700" },
  cancelled: { label: "Huỷ", cls: "bg-muted text-muted-foreground line-through" },
  no_show: { label: "Huỷ", cls: "bg-muted text-muted-foreground line-through" },
};

/** Danh sách lịch hẹn hôm nay — CHỈ ĐỌC (thao tác nằm ở tab Bookings). */
export function TodayAppointments({ bookings }: { bookings: BookingForDay[] }) {
  if (bookings.length === 0) {
    return (
      <p className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
        Chưa có lịch hẹn nào hôm nay.
      </p>
    );
  }

  const now = Date.now();

  return (
    <ul className="flex flex-col gap-2.5">
      {bookings.map((b) => {
        const badge = BADGE[b.status];
        const isCancelled = b.status === "cancelled" || b.status === "no_show";
        const isNow =
          !isCancelled &&
          now >= b.startAt.getTime() &&
          now < b.endAt.getTime();
        return (
          <li
            key={b.id}
            className={cn(
              "rounded-xl border bg-card p-3.5",
              isNow && "border-primary bg-primary/5 ring-2 ring-primary",
              isCancelled && "opacity-55",
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
                  className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"
                >
                  <Phone className="size-3.5" aria-hidden /> {b.customerPhone}
                </a>
              </div>
              <Badge className={cn("shrink-0", badge.cls)}>{badge.label}</Badge>
            </div>

            <div className="mt-2 flex items-end justify-between gap-2">
              <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                {b.items.map((it) => it.service.name).join(", ")}
              </p>
              <span className="shrink-0 text-sm font-bold">{vnd.format(b.totalPrice)}đ</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
