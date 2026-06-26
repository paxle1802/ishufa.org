"use server";

import { revalidatePath } from "next/cache";

import { cancelBookingByToken, type CancelResult } from "@/lib/booking/cancel-booking";

/** Khách tự huỷ qua token. Helper đã kiểm status + cutoff. */
export async function cancelAction(token: string): Promise<CancelResult> {
  const res = await cancelBookingByToken(token);
  if (res.ok) revalidatePath(`/huy/${token}`);
  return res;
}
