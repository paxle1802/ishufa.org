// Service worker tối giản cho PWA ShufaBook.
// Mục tiêu: đủ điều kiện "cài được" (có fetch handler) + fallback offline,
// KHÔNG cache API/dữ liệu động để tránh hiển thị dữ liệu cũ.
const CACHE = "shufabook-shell-v1";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      ),
  );
  self.clients.claim();
});

// Chỉ can thiệp điều hướng trang: ưu tiên mạng, mất mạng → trang offline.
// Mọi request khác (API, _next, ảnh...) để trình duyệt xử lý bình thường.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.mode !== "navigate") return;
  event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
});

// Web Push: hiện thông báo khi có khách đặt/huỷ lịch.
self.addEventListener("push", (event) => {
  let data = { title: "ShufaBook", body: "Bạn có thông báo mới", url: "/admin" };
  try {
    if (event.data) data = Object.assign(data, event.data.json());
  } catch (e) {
    /* payload không phải JSON */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url || "/admin" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/admin";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.includes(url) && "focus" in c) return c.focus();
      }
      return self.clients.openWindow ? self.clients.openWindow(url) : undefined;
    }),
  );
});
