"use server";

import { and, eq, like } from "drizzle-orm";

import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db";
import { bookings, type BookingStatus } from "@/lib/db/schema";

export interface ScannedBooking {
  id: string;
  customerName: string;
  customerPhone: string;
  startAt: string;
  endAt: string;
  status: BookingStatus;
  totalPrice: number;
  serviceNames: string[];
}

type LookupResult =
  | { ok: true; booking: ScannedBooking }
  | { ok: false; error: string };

/** Tra cứu booking theo mã QR (token đầy đủ) hoặc mã ngắn (tiền tố), scope theo shop. */
export async function lookupBookingByCode(code: string): Promise<LookupResult> {
  try {
    const { shopId } = await requireAdmin();

    const clean = code.trim();
    // QR có thể chứa URL → lấy đoạn cuối; còn lại coi là token/mã.
    const value = clean.includes("/") ? clean.split("/").pop()! : clean;
    if (!value || value.length < 4) return { ok: false, error: "Mã không hợp lệ" };

    const row = await db.query.bookings.findFirst({
      where: and(
        eq(bookings.shopId, shopId),
        // Token đầy đủ → khớp chính xác; mã ngắn → khớp tiền tố.
        value.length >= 16
          ? eq(bookings.cancelToken, value)
          : like(bookings.cancelToken, `${value}%`),
      ),
      with: { items: { with: { service: { columns: { name: true } } } } },
    });

    if (!row) return { ok: false, error: "Không tìm thấy lịch hẹn cho mã này" };

    return {
      ok: true,
      booking: {
        id: row.id,
        customerName: row.customerName,
        customerPhone: row.customerPhone,
        startAt: row.startAt.toISOString(),
        endAt: row.endAt.toISOString(),
        status: row.status,
        totalPrice: row.totalPrice,
        serviceNames: row.items.map((it) => it.service.name),
      },
    };
  } catch (err) {
    console.error("[lookupBookingByCode]", err);
    return { ok: false, error: "Lỗi server, vui lòng thử lại" };
  }
}
