import { z } from "zod";

/** Gói combo (admin CRUD template). */
export const packageSchema = z.object({
  name: z.string().trim().min(1, "Nhập tên gói").max(120),
  price: z.coerce.number().int().min(0),
  sessions: z.coerce.number().int().min(1, "Số buổi ≥ 1").max(1000),
  validityDays: z.coerce.number().int().min(1, "Hạn dùng ≥ 1 ngày").max(3650),
  serviceId: z.string().uuid().optional().nullable(),
  active: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});
export type PackageInput = z.infer<typeof packageSchema>;

/** Bán gói cho khách (tại quầy). */
export const sellPackageSchema = z.object({ packageId: z.string().uuid() });
