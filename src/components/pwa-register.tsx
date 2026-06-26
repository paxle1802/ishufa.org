"use client";

import { useEffect } from "react";

/** Đăng ký service worker để bật PWA (chạy sau khi trang tải xong). */
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.error("[PWA] đăng ký SW lỗi", err));
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
