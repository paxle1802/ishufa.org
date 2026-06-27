"use server";

import { revalidatePath } from "next/cache";

import { cancelBookingByToken, type CancelResult } from "@/lib/booking/cancel-booking";
import { getBookingByToken } from "@/lib/booking/queries";
import { sendShopNotification } from "@/lib/push/send";
import { formatLocal } from "@/lib/tz";

/** Khách tự huỷ qua token. Helper đã kiểm status + cutoff. */
export async function cancelAction(token: string): Promise<CancelResult> {
  const res = await cancelBookingByToken(token);
  if (res.ok) {
    revalidatePath(`/huy/${token}`);
    // Thông báo đẩy cho chủ shop (best-effort).
    try {
      const b = await getBookingByToken(token);
      if (b) {
        await sendShopNotification(b.shopId, {
          title: "Khách huỷ lịch hẹn",
          body: `${b.customerName} · ${formatLocal(b.startAt, "HH:mm dd-MM")}`,
          url: "/admin/bookings",
        });
      }
    } catch {
      /* bỏ qua lỗi gửi thông báo */
    }
  }
  return res;
}
