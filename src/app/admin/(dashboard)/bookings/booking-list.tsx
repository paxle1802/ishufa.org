"use client";

import { Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PaymentQrDialog } from "@/components/admin/payment-qr-dialog";
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
  confirmed: "Đã xác nhận",
  arrived: "Đã đến",
  completed: "Hoàn tất",
  no_show: "Vắng mặt",
  cancelled: "Đã huỷ",
};
const STATUS_CLASS: Record<BookingStatus, string> = {
  confirmed: "bg-blue-100 text-blue-700",
  arrived: "bg-violet-100 text-violet-700",
  completed: "bg-green-100 text-green-700",
  no_show: "bg-amber-100 text-amber-700",
  cancelled: "bg-muted text-muted-foreground line-through",
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

  return (
    <ul className="flex flex-col gap-3">
      {bookings.map((b) => (
        <li key={b.id} className="glass rounded-xl border p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold">
                {formatLocal(b.startAt, "HH:mm")}–{formatLocal(b.endAt, "HH:mm")}
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

          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm font-semibold">{vnd.format(b.totalPrice)}đ</span>
            <BookingStatusControl
              bookingId={b.id}
              status={b.status}
              activePackages={packagesByPhone[b.customerPhone] ?? []}
            />
          </div>

          {bank && b.status !== "cancelled" && b.totalPrice > 0 && (
            <div className="mt-2 flex justify-end">
              <PaymentQrDialog
                bankBin={bank.bankBin}
                accountNumber={bank.accountNumber}
                accountName={bank.accountName}
                amount={b.totalPrice}
                addInfo={`TT ${b.id.slice(0, 8).toUpperCase()}`}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
