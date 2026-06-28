import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import {
  getActiveCustomerPackages,
  getCustomerByToken,
  listBookingsByPhone,
} from "@/lib/db/queries-customers";
import { getShopById } from "@/lib/db/queries";
import type { BookingStatus } from "@/lib/db/schema";
import { formatLocal, formatDateStr } from "@/lib/tz";

const vnd = new Intl.NumberFormat("vi-VN");

const STATUS: Record<BookingStatus, { label: string; cls: string }> = {
  confirmed: { label: "Đã đặt chỗ", cls: "bg-blue-100 text-blue-700" },
  arrived: { label: "Đang làm", cls: "bg-violet-100 text-violet-700" },
  completed: { label: "Đã thanh toán", cls: "bg-green-100 text-green-700" },
  cancelled: { label: "Huỷ", cls: "bg-muted-foreground/20 text-muted-foreground" },
};

/**
 * "Trang của tôi" — công khai qua link token (không cần đăng nhập).
 * Hiển thị combo còn buổi, điểm thưởng, lịch sử đặt của khách. Chỉ đọc.
 */
export default async function MyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const customer = await getCustomerByToken(token);
  if (!customer) notFound();

  const [shop, packages, history] = await Promise.all([
    getShopById(customer.shopId),
    getActiveCustomerPackages(customer.shopId, customer.id),
    listBookingsByPhone(customer.shopId, customer.phone),
  ]);

  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      {/* Quay lại trang đặt lịch của salon */}
      {shop && (
        <a
          href={`/s/${shop.slug}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Về trang đặt lịch
        </a>
      )}

      {/* Header */}
      <header className="rounded-3xl bg-primary p-6 text-white shadow-lg">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">
          {shop?.name ?? "Salon"}
        </p>
        <h1 className="font-heading mt-1 text-3xl font-semibold leading-tight">
          {customer.name}
        </h1>
        <p className="mt-1 text-sm text-white/70">{customer.phone}</p>
        <div className="mt-4 inline-flex items-baseline gap-2 rounded-full bg-white/15 px-4 py-1.5">
          <span className="text-2xl font-bold">{customer.loyaltyPoints}</span>
          <span className="text-sm text-white/80">điểm thưởng</span>
        </div>
      </header>

      {/* Combo còn hiệu lực */}
      <section className="mt-5">
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
          Gói combo của bạn
        </h2>
        {packages.length === 0 ? (
          <p className="rounded-xl border border-dashed py-6 text-center text-sm text-muted-foreground">
            Chưa có gói combo nào đang dùng.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {packages.map((p) => (
              <li key={p.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">
                    {p.packageName ?? (p.kind === "prepaid" ? "Gói nạp tiền" : "Gói combo")}
                  </span>
                  <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                    {p.kind === "prepaid"
                      ? `số dư ${vnd.format(p.balanceRemaining)}đ`
                      : `còn ${p.sessionsRemaining}/${p.sessionsTotal} buổi`}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Hạn dùng: {formatDateStr(formatLocal(p.expiresAt, "yyyy-MM-dd"))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Lịch sử đặt */}
      <section className="mt-5">
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
          Lịch sử đặt lịch
        </h2>
        {history.length === 0 ? (
          <p className="rounded-xl border border-dashed py-6 text-center text-sm text-muted-foreground">
            Chưa có lịch hẹn nào.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {history.slice(0, 20).map((b) => {
              const badge = STATUS[b.status];
              return (
                <li key={b.id} className="rounded-2xl border border-border bg-card p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {formatLocal(b.startAt, "HH:mm 'ngày' dd-MM-yyyy")}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {b.items.map((it) => it.service.name).join(", ")}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p className="mt-2 text-right text-sm font-bold">
                    {vnd.format(b.totalPrice)}đ
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
