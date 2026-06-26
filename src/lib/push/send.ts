import webpush from "web-push";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { env } from "@/lib/env";

let configured = false;

/** Cấu hình VAPID 1 lần; trả false nếu chưa khai báo key → tính năng tắt êm. */
function ensureConfigured(): boolean {
  if (configured) return true;
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(
    env.VAPID_SUBJECT || "mailto:admin@ishufa.org",
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  );
  configured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/** Gửi thông báo đẩy tới mọi thiết bị đã đăng ký của shop. Best-effort. */
export async function sendShopNotification(
  shopId: string,
  payload: PushPayload,
): Promise<void> {
  if (!ensureConfigured()) return;

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.shopId, shopId));
  if (subs.length === 0) return;

  const data = JSON.stringify(payload);
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          data,
        );
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        // 404/410 → subscription hết hạn → xoá để không gửi lại.
        if (code === 404 || code === 410) {
          await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.id, s.id))
            .catch(() => {});
        }
      }
    }),
  );
}
