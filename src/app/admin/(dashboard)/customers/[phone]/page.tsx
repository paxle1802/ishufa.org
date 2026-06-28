import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getActiveCustomerPackages,
  getCustomerByPhone,
  getCustomerLedger,
  listActivePackages,
  listBookingsByPhone,
} from "@/lib/db/queries-customers";
import { formatLocal } from "@/lib/tz";
import { NotesEditor } from "./notes-editor";
import { RedeemForm } from "./redeem-form";
import { SellPackageForm } from "./sell-package-form";
import { ShareLink } from "./share-link";

const vnd = new Intl.NumberFormat("vi-VN");

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Đã đặt chỗ",
  arrived: "Đang làm",
  completed: "Đã thanh toán",
  cancelled: "Huỷ",
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const { shopId } = await requireAdmin();
  const { phone: rawPhone } = await params;
  const phone = decodeURIComponent(rawPhone);

  const customer = await getCustomerByPhone(shopId, phone);
  if (!customer) notFound();

  const [bookingHistory, activePackages, ledger, availablePackages] =
    await Promise.all([
      listBookingsByPhone(shopId, phone),
      getActiveCustomerPackages(shopId, customer.id),
      getCustomerLedger(shopId, customer.id),
      listActivePackages(shopId),
    ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <a
          href="/admin/customers"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground"
        >
          ← Danh sách
        </a>
        <h1 className="text-xl font-semibold">{customer.name}</h1>
        <p className="text-sm text-muted-foreground">{customer.phone}</p>
        <div className="mt-2 flex flex-wrap gap-3 text-sm">
          <span className="rounded-md bg-muted px-2 py-0.5">
            {customer.visitCount} lượt ghé
          </span>
          <span className="rounded-md bg-muted px-2 py-0.5">
            {vnd.format(customer.totalSpent)}đ
          </span>
          <span className="rounded-md bg-muted px-2 py-0.5">
            {customer.loyaltyPoints} điểm
          </span>
        </div>
      </div>

      {/* Chia sẻ "Trang của tôi" cho khách */}
      <section className="space-y-2">
        <h2 className="font-medium">Trang của khách (combo / điểm)</h2>
        <ShareLink token={customer.accessToken} />
      </section>

      {/* Ghi chú */}
      <section className="space-y-2">
        <h2 className="font-medium">Ghi chú</h2>
        <NotesEditor customerId={customer.id} notes={customer.notes ?? ""} />
      </section>

      {/* Đổi điểm */}
      <section className="space-y-2">
        <h2 className="font-medium">Đổi điểm tích luỹ</h2>
        <RedeemForm customerId={customer.id} balance={customer.loyaltyPoints} />
      </section>

      {/* Bán gói */}
      {availablePackages.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-medium">Bán gói combo</h2>
          <SellPackageForm
            customerId={customer.id}
            packages={availablePackages}
          />
        </section>
      )}

      {/* Gói đang có */}
      {activePackages.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-medium">Gói đang dùng</h2>
          <ul className="flex flex-col gap-2">
            {activePackages.map((p) => (
              <li key={p.id} className="rounded-xl border bg-card p-3 text-sm">
                <p className="font-semibold">{p.packageName ?? "Gói không tên"}</p>
                <p className="text-muted-foreground">
                  {p.kind === "prepaid"
                    ? `Số dư: ${vnd.format(p.balanceRemaining)}đ`
                    : `${p.sessionsRemaining}/${p.sessionsTotal} buổi còn lại`}
                </p>
                <p className="text-muted-foreground">
                  HSD: {formatLocal(p.expiresAt, "dd-MM-yyyy")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Lịch sử booking */}
      <section className="space-y-2">
        <h2 className="font-medium">Lịch sử đặt hẹn</h2>
        {bookingHistory.length === 0 ? (
          <p className="rounded-xl border border-dashed py-6 text-center text-sm text-muted-foreground">
            Chưa có lịch hẹn nào.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {bookingHistory.map((b) => (
              <li key={b.id} className="rounded-xl border bg-card p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">
                    {formatLocal(b.startAt, "HH:mm dd-MM-yyyy")}
                  </span>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs">
                    {STATUS_LABEL[b.status] ?? b.status}
                  </span>
                </div>
                <p className="mt-0.5 text-muted-foreground">
                  {b.items.map((it) => it.service.name).join(", ")}
                </p>
                <p className="mt-0.5 font-medium">{vnd.format(b.totalPrice)}đ</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Sổ cái điểm */}
      <section className="space-y-2">
        <h2 className="font-medium">Lịch sử điểm</h2>
        {ledger.length === 0 ? (
          <p className="rounded-xl border border-dashed py-6 text-center text-sm text-muted-foreground">
            Chưa có giao dịch điểm nào.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {ledger.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm"
              >
                <div>
                  <span className="text-muted-foreground">
                    {formatLocal(entry.createdAt, "dd-MM-yyyy HH:mm")}
                  </span>
                  {entry.note && (
                    <p className="text-xs text-muted-foreground">{entry.note}</p>
                  )}
                </div>
                <span
                  className={
                    entry.points > 0
                      ? "font-semibold text-green-600"
                      : "font-semibold text-red-500"
                  }
                >
                  {entry.points > 0 ? "+" : ""}
                  {entry.points} đ
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
