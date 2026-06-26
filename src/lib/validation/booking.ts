import { z } from "zod";

/** Chuẩn hoá SĐT: +84xxxxxxxxx → 0xxxxxxxxx. */
export function normalizePhone(phone: string): string {
  const p = phone.trim().replace(/\s+/g, "");
  return p.startsWith("+84") ? "0" + p.slice(3) : p;
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
});
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

/** Payload lấy slot khả dụng. */
export const slotsQuerySchema = z.object({
  slug: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ"),
  serviceIds: z.array(z.string().uuid()).min(1).max(10),
});
export type SlotsQueryInput = z.infer<typeof slotsQuerySchema>;
