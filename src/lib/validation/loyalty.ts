import { z } from "zod";

/** Đổi điểm tại quầy. */
export const redeemSchema = z.object({
  points: z.coerce.number().int().min(1, "Số điểm phải ≥ 1"),
  note: z.string().trim().max(200).optional().or(z.literal("")),
});
export type RedeemInput = z.infer<typeof redeemSchema>;
