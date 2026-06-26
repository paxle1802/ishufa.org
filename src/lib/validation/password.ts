import { z } from "zod";

/** Đổi mật khẩu bắt buộc (lần đầu / sau reset). */
export const changePasswordSchema = z
  .object({
    password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự").max(100),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Mật khẩu nhập lại không khớp",
    path: ["confirm"],
  });
