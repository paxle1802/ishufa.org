"use server";

import { and, eq } from "drizzle-orm";

import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";

interface SubInput {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** Lưu (hoặc cập nhật) đăng ký Web Push của thiết bị chủ shop. */
export async function savePushSubscription(sub: SubInput): Promise<{ ok: boolean }> {
  try {
    const { shopId } = await requireAdmin();
    if (!sub?.endpoint || !sub.p256dh || !sub.auth) return { ok: false };
    await db
      .insert(pushSubscriptions)
      .values({ shopId, endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { shopId, p256dh: sub.p256dh, auth: sub.auth },
      });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function deletePushSubscription(endpoint: string): Promise<{ ok: boolean }> {
  try {
    const { shopId } = await requireAdmin();
    await db
      .delete(pushSubscriptions)
      .where(
        and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.shopId, shopId)),
      );
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
