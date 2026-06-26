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
