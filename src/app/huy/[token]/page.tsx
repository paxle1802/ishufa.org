import { ChevronLeft, Phone } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { cancelCutoffPassed } from "@/lib/booking/cancel-booking";
import { getBookingByToken } from "@/lib/booking/queries";
import { formatLocal } from "@/lib/tz";
import { CancelConfirm } from "./cancel-confirm";

const vnd = new Intl.NumberFormat("vi-VN");
const STATUS_DONE: Record<string, string> = {
  cancelled: "đã được huỷ",
  completed: "đã hoàn tất",
  no_show: "được đánh dấu vắng mặt",
};

export default async function CancelPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const booking = await getBookingByToken(token);
  if (!booking) notFound();

  const when = formatLocal(booking.startAt, "HH:mm 'ngày' dd/MM/yyyy");
  const services = booking.items.map((i) => i.service.name).join(", ");
  const cutoff = cancelCutoffPassed(booking.startAt, booking.shop.cancelCutoffMin);
  const isConfirmed = booking.status === "confirmed";

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <Link
        href={`/s/${booking.shop.slug}`}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Về trang đặt lịch
      </Link>
      <h1 className="font-heading text-2xl font-semibold">Huỷ lịch hẹn</h1>
      <p className="mt-1 text-sm text-muted-foreground">{booking.shop.name}</p>

      <div className="mt-5 space-y-2 rounded-2xl border bg-card p-5">
        <Row label="Dịch vụ" value={services} />
        <Row label="Thời gian" value={when} />
        <Row label="Khách" value={booking.customerName} />
        <Row label="Tổng" value={`${vnd.format(booking.totalPrice)}đ`} />
      </div>

      <div className="mt-6">
        {!isConfirmed ? (
          <p className="rounded-xl border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
            Lịch hẹn này {STATUS_DONE[booking.status] ?? "không thể huỷ"}.
          </p>
        ) : cutoff ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-800">
            Đã quá hạn huỷ trực tuyến.
            {booking.shop.contactPhone && (
              <>
                {" "}Vui lòng gọi{" "}
                <a className="font-semibold underline" href={`tel:${booking.shop.contactPhone}`}>
                  {booking.shop.contactPhone}
                </a>{" "}
                để được hỗ trợ.
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="rounded-xl border border-border bg-secondary p-3 text-sm text-muted-foreground">
              Bạn có thể huỷ trực tuyến chậm nhất{" "}
              <span className="font-semibold text-foreground">
                {booking.shop.cancelCutoffMin} phút
              </span>{" "}
              trước giờ hẹn. Quá hạn, vui lòng gọi salon để báo huỷ.
            </p>
            <CancelConfirm token={token} />
            {booking.shop.contactPhone && (
              <a
                href={`tel:${booking.shop.contactPhone}`}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-input text-sm font-semibold text-foreground transition-colors hover:bg-muted/60"
              >
                <Phone className="size-4" />
                Gọi báo huỷ
              </a>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
