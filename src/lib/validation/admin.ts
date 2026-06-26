import { z } from "zod";

/**
 * Zod schemas cho mọi mutation admin (Phase 4).
 * Dùng chung giữa Server Actions (validate input) và form client.
 */

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const HEX = /^#([0-9a-fA-F]{6})$/;

// --- Dịch vụ ---
export const serviceSchema = z.object({
  name: z.string().trim().min(1, "Nhập tên dịch vụ").max(120),
  price: z.coerce.number().int().min(0, "Giá không hợp lệ").max(100_000_000),
  durationMin: z.coerce
    .number()
    .int()
    .min(5, "Tối thiểu 5 phút")
    .max(600, "Tối đa 600 phút"),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  imageUrl: z.string().url("URL ảnh không hợp lệ").optional().or(z.literal("")),
  active: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});
export type ServiceInput = z.infer<typeof serviceSchema>;

// --- Cấu hình đặt lịch của shop ---
export const bookingSettingsSchema = z.object({
  slotIntervalMin: z.coerce.number().int().min(5).max(120),
  capacity: z.coerce.number().int().min(1).max(50),
  maxAdvanceDays: z.coerce.number().int().min(1).max(365),
  minLeadMin: z.coerce.number().int().min(0).max(1440),
  cancelCutoffMin: z.coerce.number().int().min(0).max(1440),
  gracePeriodMin: z.coerce.number().int().min(0).max(120),
});
export type BookingSettingsInput = z.infer<typeof bookingSettingsSchema>;

// --- Thông tin + branding shop ---
export const shopInfoSchema = z.object({
  name: z.string().trim().min(1, "Nhập tên salon").max(120),
  address: z.string().trim().max(255).optional().or(z.literal("")),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  contactPhone: z
    .string()
    .trim()
    .regex(/^0\d{9,10}$/, "Số điện thoại không hợp lệ")
    .optional()
    .or(z.literal("")),
  accentColor: z.string().regex(HEX, "Mã màu hex không hợp lệ (vd #7c3aed)"),
});
export type ShopInfoInput = z.infer<typeof shopInfoSchema>;

// --- Ngày nghỉ ---
export const closureSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ"),
  reason: z.string().trim().max(200).optional().or(z.literal("")),
});
export type ClosureInput = z.infer<typeof closureSchema>;

// --- Giờ mở cửa (nhiều khoảng/ngày) ---
export const workingIntervalSchema = z
  .object({
    weekday: z.coerce.number().int().min(0).max(6),
    openTime: z.string().regex(HHMM, "Giờ mở không hợp lệ"),
    closeTime: z.string().regex(HHMM, "Giờ đóng không hợp lệ"),
  })
  .refine((v) => v.openTime < v.closeTime, {
    message: "Giờ đóng phải sau giờ mở",
    path: ["closeTime"],
  });

export const workingHoursSchema = z.object({
  intervals: z.array(workingIntervalSchema).max(50),
});
export type WorkingHoursInput = z.infer<typeof workingHoursSchema>;
