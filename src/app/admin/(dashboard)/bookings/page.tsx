import { ScanLine } from "lucide-react";
import Link from "next/link";

import { autoCancelStaleBookings } from "@/lib/booking/auto-cancel";
import {
  getActivePackagesForPhones,
  listBookingsForDay,
} from "@/lib/booking/queries";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getShopById } from "@/lib/db/queries";
import type { ActivePackage } from "./booking-status-control";
import { BookingList, type ShopBank } from "./booking-list";
import { DayPicker } from "./day-picker";

function todayVn(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Saigon" }).format(new Date());
}

/** Gom gói combo còn hiệu lực theo SĐT cho danh sách booking. */
async function packagesByPhoneFor(
  shopId: string,
  phones: string[],
): Promise<Record<string, ActivePackage[]>> {
  const rows = await getActivePackagesForPhones(shopId, [...new Set(phones)]);
  const map: Record<string, ActivePackage[]> = {};
  for (const r of rows) {
    (map[r.phone] ??= []).push({
      id: r.id,
      name: r.name,
      sessionsRemaining: r.sessionsRemaining,
    });
  }
  return map;
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { shopId } = await requireAdmin();
  const { date } = await searchParams;
  const day = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayVn();

  await autoCancelStaleBookings(shopId); // tự huỷ no-show quá giờ ân hạn
  const shop = await getShopById(shopId);
  const bank: ShopBank | null =
    shop?.bankBin && shop.bankAccountNumber && shop.bankAccountName
      ? {
          bankBin: shop.bankBin,
          accountNumber: shop.bankAccountNumber,
          accountName: shop.bankAccountName,
        }
      : null;

  const bookings = await listBookingsForDay(shopId, day);
  const active = bookings.filter((b) => b.status !== "cancelled").length;
  const packagesByPhone = await packagesByPhoneFor(
    shopId,
    bookings.map((b) => b.customerPhone),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Lịch hẹn</h1>
          <p className="text-sm text-muted-foreground">{active} lịch trong ngày</p>
        </div>
        <Button render={<Link href="/admin/checkin" />} variant="outline" size="sm" className="gap-1.5">
          <ScanLine className="size-4" />
          Quét QR Nhận Khách
        </Button>
      </div>
      <DayPicker date={day} />
      <BookingList bookings={bookings} packagesByPhone={packagesByPhone} bank={bank} />
    </div>
  );
}
