import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { formatLocal } from "@/lib/tz";

const vnd = new Intl.NumberFormat("vi-VN");

export interface OverdueArrived {
  id: string;
  customerName: string;
  startAt: Date;
  totalPrice: number;
}

/**
 * Nhắc các đơn "Đang làm" còn sót từ ngày trước (quên bấm Tính tiền).
 * Mỗi đơn link tới đúng ngày trong Bookings để chủ đóng (thanh toán / huỷ).
 */
export function OverdueArrivedAlert({ bookings }: { bookings: OverdueArrived[] }) {
  if (bookings.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
      <div className="flex items-center gap-2 text-amber-800">
        <AlertTriangle className="size-5 shrink-0" aria-hidden />
        <p className="text-sm font-semibold">
          {bookings.length} đơn “Đang làm” từ ngày trước chưa đóng
        </p>
      </div>
      <p className="mt-1 text-xs text-amber-700">
        Có thể do quên bấm Tính tiền. Bấm vào để mở và thanh toán hoặc huỷ.
      </p>
      <ul className="mt-3 flex flex-col gap-1.5">
        {bookings.map((b) => (
          <li key={b.id}>
            <Link
              href={`/admin/bookings?date=${formatLocal(b.startAt, "yyyy-MM-dd")}#b-${b.id}`}
              className="flex items-center justify-between gap-2 rounded-lg bg-white/70 px-3 py-2 text-sm ring-1 ring-amber-200 transition-colors hover:bg-white"
            >
              <span className="min-w-0 truncate">
                <span className="font-medium">{b.customerName}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {formatLocal(b.startAt, "HH:mm dd-MM-yyyy")}
                </span>
              </span>
              <span className="shrink-0 font-semibold">{vnd.format(b.totalPrice)}đ</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
