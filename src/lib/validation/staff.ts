import { z } from "zod";

/** Thợ (super admin quản lý). */
export const staffSchema = z.object({
  name: z.string().trim().min(1, "Nhập tên thợ").max(120),
  active: z.coerce.boolean().default(true),
  // Cơ chế lương kết hợp: lương cứng (VND/tháng) + ăn chia %.
  baseSalary: z.coerce.number().int().min(0).max(1_000_000_000).default(0),
  commissionPct: z.coerce.number().int().min(0).max(100).default(0),
  sortOrder: z.coerce.number().int().min(0).default(0),
});
export type StaffInput = z.infer<typeof staffSchema>;

/** Gán dịch vụ cho thợ (staffId null = bỏ gán). */
export const assignServiceStaffSchema = z.object({
  serviceId: z.string().uuid(),
  staffId: z.string().uuid().nullable(),
});
