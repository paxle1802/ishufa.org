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
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-xl font-bold">Huỷ lịch hẹn</h1>
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
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center text-sm text-amber-200">
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
          <CancelConfirm token={token} />
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
