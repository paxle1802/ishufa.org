"use client";

import { buildIcs } from "@/lib/ics";
import { formatLocal } from "@/lib/tz";
import type { BookingSummary } from "./actions";
import type { PublicShop } from "./types";

const vnd = new Intl.NumberFormat("vi-VN");

interface BookingSuccessProps {
  booking: BookingSummary;
  shop: PublicShop;
}

function downloadIcs(booking: BookingSummary) {
  const ics = buildIcs({
    uid: booking.cancelToken,
    title: "Lịch hẹn " + booking.shopName,
    start: new Date(booking.startAt),
    end: new Date(booking.endAt),
    description: booking.serviceNames.join(", "),
    location: booking.shopAddress ?? undefined,
  });
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "lich-hen.ics";
  a.click();
  URL.revokeObjectURL(url);
}

export function BookingSuccess({ booking }: BookingSuccessProps) {
  const dateTimeLabel = formatLocal(
    new Date(booking.startAt),
    "HH:mm 'ngày' dd/MM/yyyy"
  );

  // Short code: first 8 chars of cancelToken for display
  const shortCode = booking.cancelToken.slice(0, 8).toUpperCase();

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      {/* Success icon */}
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <span
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--accent)" }}
          aria-hidden="true"
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path
              d="M7 16l7 7 11-13"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h1 className="text-xl font-bold">Đặt lịch thành công!</h1>
        <p className="text-sm text-muted-foreground">
          Chúng tôi sẽ liên hệ xác nhận lịch hẹn của bạn.
        </p>
      </div>

      {/* Booking detail card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        {/* Booking code */}
        <div className="mb-4 flex items-center justify-between border-b border-dashed border-border pb-4">
          <span className="text-sm text-muted-foreground">Mã đặt lịch</span>
          <span className="rounded-md bg-muted px-2.5 py-1 font-mono text-sm font-bold tracking-wider">
            {shortCode}
          </span>
        </div>

        {/* Shop */}
        <div className="mb-3">
          <p className="text-xs text-muted-foreground">Salon</p>
          <p className="font-semibold">{booking.shopName}</p>
          {booking.shopAddress && (
            <p className="text-sm text-muted-foreground">{booking.shopAddress}</p>
          )}
        </div>

        {/* Services */}
        <div className="mb-3">
          <p className="text-xs text-muted-foreground">Dịch vụ</p>
          <ul className="mt-0.5 list-none space-y-0.5">
            {booking.serviceNames.map((name, i) => (
              <li key={i} className="flex items-center gap-1.5 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shrink-0" />
                {name}
              </li>
            ))}
          </ul>
        </div>

        {/* Date/time */}
        <div className="mb-3">
          <p className="text-xs text-muted-foreground">Thời gian</p>
          <p className="font-medium capitalize">{dateTimeLabel}</p>
          <p className="text-xs text-muted-foreground">{booking.totalDurationMin} phút</p>
        </div>

        {/* Total price */}
        <div className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2.5">
          <span className="text-sm font-medium">Tổng thanh toán</span>
          <span className="text-base font-bold" style={{ color: "var(--accent)" }}>
            {vnd.format(booking.totalPrice)}đ
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => downloadIcs(booking)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--accent)] text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ color: "var(--accent)" }}
          aria-label="Tải file lịch .ics về thiết bị"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M8 2v8m0 0l-3-3m3 3l3-3M3 13h10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Thêm vào lịch (.ics)
        </button>

        <a
          href={`/huy/${booking.cancelToken}`}
          className="flex h-11 w-full items-center justify-center rounded-xl text-sm text-muted-foreground underline-offset-4 hover:underline"
          aria-label="Huỷ lịch hẹn này"
        >
          Huỷ lịch hẹn
        </a>
      </div>
    </div>
  );
}
