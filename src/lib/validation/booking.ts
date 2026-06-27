import { z } from "zod";

/**
 * Chuẩn hoá SĐT Việt Nam về dạng 0xxxxxxxxx. Chấp nhận:
 *  +84902193962 · 0084902193962 · 84902193962 · 902193962 · 0902193962
 * (bỏ mọi khoảng trắng/dấu chấm/gạch ngang).
 */
export function normalizePhone(phone: string): string {
  let p = phone.replace(/[\s.()-]/g, "");
  if (p.startsWith("+84")) p = "0" + p.slice(3);
  else if (p.startsWith("0084")) p = "0" + p.slice(4);
  else if (p.startsWith("84") && p.length === 11) p = "0" + p.slice(2);
  else if (/^[35789]\d{8}$/.test(p)) p = "0" + p; // mất số 0 đầu (do autofill)
  return p;
}

const phoneSchema = z
  .string()
  .trim()
  .transform(normalizePhone)
  .refine((v) => /^0\d{9,10}$/.test(v), "Số điện thoại không hợp lệ");

/** Thông tin khách ở bước nhập form. */
export const customerSchema = z.object({
  customerName: z.string().trim().min(1, "Nhập họ tên").max(120),
  customerPhone: phoneSchema,
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

/** Payload tạo booking (server action). */
export const createBookingSchema = customerSchema.extend({
  slug: z.string().min(1),
  serviceIds: z.array(z.string().uuid()).min(1, "Chọn ít nhất 1 dịch vụ").max(10),
  startAt: z.string().datetime("Thời điểm không hợp lệ"), // ISO UTC
  promoCode: z.string().trim().toUpperCase().max(40).optional(),
});
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

/** Payload lấy slot khả dụng. */
export const slotsQuerySchema = z.object({
  slug: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ"),
  serviceIds: z.array(z.string().uuid()).min(1).max(10),
});
export type SlotsQueryInput = z.infer<typeof slotsQuerySchema>;
