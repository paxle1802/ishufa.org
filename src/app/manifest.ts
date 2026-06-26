import type { MetadataRoute } from "next";

/** Web App Manifest — biến ShufaBook thành PWA cài được lên màn hình chính. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ShufaBook — Đặt lịch salon",
    short_name: "ShufaBook",
    description: "Quản lý đặt lịch salon: lịch hẹn, khách hàng, thu tiền VietQR.",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ECE8E4",
    theme_color: "#F26430",
    lang: "vi",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
