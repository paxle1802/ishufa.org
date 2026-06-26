"use server";

import { headers } from "next/headers";

import { createBooking, SlotUnavailableError } from "@/lib/booking/create-booking";
import { PromoInvalidError } from "@/lib/promotions/apply-promotion";
import { getAvailability } from "@/lib/availability/get-availability";
import { getShopBySlug, listActiveServices } from "@/lib/db/queries";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  createBookingSchema,
  slotsQuerySchema,
  type CreateBookingInput,
  type SlotsQueryInput,
} from "@/lib/validation/booking";

const MS_PER_MIN = 60_000;

/** Lấy IP client từ header proxy (Vercel/edge). */
async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "unknown";
}

/** Tổng duration + price từ các dịch vụ khách chọn (luôn tính ở server). */
async function resolveServices(shopId: string, serviceIds: string[]) {
  const all = await listActiveServices(shopId);
  const chosen = serviceIds
    .map((id) => all.find((s) => s.id === id))
    .filter((s): s is (typeof all)[number] => Boolean(s));
  if (chosen.length !== serviceIds.length) return null; // có dịch vụ không hợp lệ
  return chosen;
}

export type SlotsResult =
  | { ok: true; slots: string[]; totalDurationMin: number; totalPrice: number }
  | { ok: false; error: string };

export async function getSlotsAction(input: SlotsQueryInput): Promise<SlotsResult> {
  const parsed = slotsQuerySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }
  const shop = await getShopBySlug(parsed.data.slug);
  if (!shop || !shop.active) return { ok: false, error: "Salon không tồn tại" };

  const chosen = await resolveServices(shop.id, parsed.data.serviceIds);
  if (!chosen) return { ok: false, error: "Dịch vụ không hợp lệ" };

  const totalDurationMin = chosen.reduce((s, x) => s + x.durationMin, 0);
  const totalPrice = chosen.reduce((s, x) => s + x.price, 0);

  const slots = await getAvailability({
    shop,
    date: parsed.data.date,
    totalDurationMin,
  });

  return {
    ok: true,
    slots: slots.map((d) => d.toISOString()),
    totalDurationMin,
    totalPrice,
  };
}

export interface BookingSummary {
  cancelToken: string;
  startAt: string;
  endAt: string;
  totalPrice: number; // net (sau giảm giá)
  originalTotal: number;
  discountAmount: number;
  totalDurationMin: number;
  serviceNames: string[];
  shopName: string;
  shopAddress: string | null;
}

export type CreateResult =
  | { ok: true; booking: BookingSummary }
  | { ok: false; error: string };

export async function createBookingAction(
  input: CreateBookingInput,
): Promise<CreateResult> {
  const parsed = createBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }
  const data = parsed.data;

  // Rate-limit: theo IP và theo SĐT (chống spam).
  const ip = await clientIp();
  const [ipOk, phoneOk] = await Promise.all([
    checkRateLimit(`book:ip:${ip}`, 10 * MS_PER_MIN, 10),
    checkRateLimit(`book:phone:${data.customerPhone}`, 60 * MS_PER_MIN, 5),
  ]);
  if (!ipOk || !phoneOk) {
    return { ok: false, error: "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút." };
  }

  const shop = await getShopBySlug(data.slug);
  if (!shop || !shop.active) return { ok: false, error: "Salon không tồn tại" };

  const chosen = await resolveServices(shop.id, data.serviceIds);
  if (!chosen) return { ok: false, error: "Dịch vụ không hợp lệ" };

  const totalDurationMin = chosen.reduce((s, x) => s + x.durationMin, 0);
  const totalPrice = chosen.reduce((s, x) => s + x.price, 0);
  const startAt = new Date(data.startAt);
  const endAt = new Date(startAt.getTime() + totalDurationMin * MS_PER_MIN);

  // Re-validate slot hợp lệ (giờ mở cửa, lead, advance) — chống post giờ tuỳ ý.
  const slots = await getAvailability({ shop, date: localDate(startAt), totalDurationMin });
  if (!slots.some((d) => d.getTime() === startAt.getTime())) {
    return { ok: false, error: "Khung giờ không còn khả dụng, vui lòng chọn lại." };
  }

  try {
    const created = await createBooking({
      shopId: shop.id,
      capacity: shop.capacity,
      startAt,
      endAt,
      totalDurationMin,
      totalPrice, // tổng gốc; createBooking trừ khuyến mãi → net
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      note: data.note ? data.note : null,
      items: chosen.map((s) => ({
        serviceId: s.id,
        priceSnapshot: s.price,
        durationSnapshot: s.durationMin,
      })),
      promoCode: data.promoCode,
    });

    return {
      ok: true,
      booking: {
        cancelToken: created.cancelToken,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        totalPrice: created.totalPrice,
        originalTotal: totalPrice,
        discountAmount: created.discountAmount,
        totalDurationMin,
        serviceNames: chosen.map((s) => s.name),
        shopName: shop.name,
        shopAddress: shop.address,
      },
    };
  } catch (err) {
    if (err instanceof PromoInvalidError) {
      return { ok: false, error: err.message };
    }
    if (err instanceof SlotUnavailableError) {
      return { ok: false, error: err.message };
    }
    console.error("createBooking error:", err);
    return { ok: false, error: "Đặt lịch thất bại, vui lòng thử lại." };
  }
}

/** "yyyy-MM-dd" theo giờ địa phương từ 1 Date UTC. */
function localDate(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Saigon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}
