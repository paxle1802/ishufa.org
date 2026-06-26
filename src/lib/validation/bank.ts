import { z } from "zod";

import { normalizeAccountName } from "@/lib/vietqr/account-name";
import { getBankByBin } from "@/lib/vietqr/banks";

/** Tài khoản nhận tiền (VietQR) chủ shop khai báo. */
export const bankSchema = z.object({
  bankBin: z
    .string()
    .trim()
    .refine((v) => !!getBankByBin(v), "Vui lòng chọn ngân hàng"),
  bankAccountNumber: z
    .string()
    .trim()
    .regex(/^\d{6,19}$/, "Số tài khoản chỉ gồm 6–19 chữ số"),
  bankAccountName: z
    .string()
    .transform((v) => normalizeAccountName(v).trim())
    .pipe(
      z
        .string()
        .min(2, "Nhập tên chủ tài khoản")
        .max(60, "Tên chủ tài khoản quá dài"),
    ),
});

export type BankInput = z.infer<typeof bankSchema>;
