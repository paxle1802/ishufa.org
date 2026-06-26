"use client";

import { useTransition } from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { BookingStatus } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { setBookingStatus } from "./actions";

const OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "completed", label: "Hoàn tất" },
  { value: "no_show", label: "Vắng mặt" },
  { value: "cancelled", label: "Đã huỷ" },
];

export function BookingStatusControl({
  bookingId,
  status,
}: {
  bookingId: string;
  status: BookingStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(next: BookingStatus) {
    if (next === status) return;
    startTransition(async () => {
      const res = await setBookingStatus(bookingId, next);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã cập nhật trạng thái");
      router.refresh();
    });
  }

  return (
    <select
      aria-label="Đổi trạng thái booking"
      value={status}
      disabled={pending}
      onChange={(e) => onChange(e.target.value as BookingStatus)}
      className={cn(
        "h-9 rounded-lg border border-input bg-background px-2 text-sm",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 outline-none",
        pending && "opacity-50",
      )}
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
