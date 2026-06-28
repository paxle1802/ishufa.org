import { z } from "zod";

/** Gói trả trước (admin CRUD template). 2 loại: combo (số buổi) | prepaid (nạp tiền). */
export const packageSchema = z
  .object({
    name: z.string().trim().min(1, "Nhập tên gói").max(120),
    kind: z.enum(["combo", "prepaid"]).default("combo"),
    price: z.coerce.number().int().min(0),
    sessions: z.coerce.number().int().min(0).max(1000),
    validityDays: z.coerce.number().int().min(1, "Hạn dùng ≥ 1 ngày").max(3650),
    serviceId: z.string().uuid().optional().nullable(),
    active: z.coerce.boolean().default(true),
    sortOrder: z.coerce.number().int().min(0).default(0),
  })
  .superRefine((v, ctx) => {
    if (v.kind === "combo" && v.sessions < 1) {
      ctx.addIssue({ code: "custom", message: "Số buổi ≥ 1", path: ["sessions"] });
    }
    if (v.kind === "prepaid" && v.price < 1) {
      ctx.addIssue({ code: "custom", message: "Số tiền nạp ≥ 1", path: ["price"] });
    }
  });
export type PackageInput = z.infer<typeof packageSchema>;

/** Bán gói cho khách (tại quầy). */
export const sellPackageSchema = z.object({ packageId: z.string().uuid() });
