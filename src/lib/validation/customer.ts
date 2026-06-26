import { z } from "zod";

/** Ghi chú khách hàng (admin sửa ở trang chi tiết). */
export const customerNotesSchema = z.object({
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});
