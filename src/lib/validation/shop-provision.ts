import { z } from "zod";

/** Super admin tạo shop mới + tài khoản chủ shop. */
export const createShopSchema = z.object({
  shopName: z.string().trim().min(1, "Nhập tên shop").max(120),
  ownerName: z.string().trim().min(1, "Nhập tên chủ shop").max(120),
  ownerPhone: z
    .string()
    .trim()
    .regex(/^0\d{9,10}$/, "Số điện thoại không hợp lệ"),
  ownerEmail: z.string().trim().email("Email không hợp lệ").optional().or(z.literal("")),
});
export type CreateShopInput = z.infer<typeof createShopSchema>;
