"use client";

import { useEffect, useState } from "react";

import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  deletePushSubscription,
  savePushSubscription,
} from "@/app/admin/(dashboard)/notifications/actions";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlB64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** Nút bật/tắt thông báo đẩy (Web Push) cho chủ shop. */
export function NotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const ok =
      !!VAPID &&
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    if (!ok) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setEnabled(!!sub))
      .catch(() => {});
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        toast.error("Bạn chưa cho phép thông báo trong trình duyệt.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(VAPID!) as BufferSource,
      });
      const json = sub.toJSON();
      const res = await savePushSubscription({
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
      });
      if (!res.ok) throw new Error("save failed");
      setEnabled(true);
      toast.success("Đã bật thông báo đặt/huỷ lịch");
    } catch (err) {
      console.error("[push] enable", err);
      toast.error("Không bật được thông báo, thử lại.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await deletePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setEnabled(false);
      toast.success("Đã tắt thông báo");
    } catch {
      toast.error("Không tắt được, thử lại.");
    } finally {
      setBusy(false);
    }
  }

  if (!supported) return null;

  return (
    <Button
      size="icon-sm"
      variant={enabled ? "default" : "outline"}
      disabled={busy}
      onClick={enabled ? disable : enable}
      title={enabled ? "Tắt thông báo" : "Bật thông báo đặt/huỷ lịch"}
      aria-label={enabled ? "Tắt thông báo" : "Bật thông báo"}
    >
      {enabled ? <Bell /> : <BellOff />}
    </Button>
  );
}
