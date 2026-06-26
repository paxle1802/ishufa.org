import { z } from "zod";

/** Khuyến mãi (admin CRUD). usageLimit: null = không giới hạn. */
export const promotionSchema = z
  .object({
    code: z.string().trim().toUpperCase().min(1, "Nhập mã").max(40),
    discountType: z.enum(["percent", "fixed"]),
    value: z.coerce.number().int().min(1, "Giá trị phải ≥ 1"),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày bắt đầu không hợp lệ"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày kết thúc không hợp lệ"),
    usageLimit: z.union([z.coerce.number().int().min(1), z.null()]).optional(),
    active: z.coerce.boolean().default(true),
  })
  .refine((v) => v.discountType !== "percent" || (v.value >= 1 && v.value <= 100), {
    message: "Phần trăm phải trong 1..100",
    path: ["value"],
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: "Ngày kết thúc phải ≥ ngày bắt đầu",
    path: ["endDate"],
  });
export type PromotionInput = z.infer<typeof promotionSchema>;
