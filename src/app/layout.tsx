import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist_Mono, Montserrat } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Body: Montserrat. Hỗ trợ tiếng Việt (subset vietnamese).
const montserrat = Montserrat({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
});

// Tiêu đề lớn (editorial): Cormorant Garamond serif.
const cormorant = Cormorant_Garamond({
  variable: "--font-heading",
  weight: ["500", "600", "700"],
  subsets: ["latin", "vietnamese"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Đặt Chỗ Salon",
  description: "Đặt lịch cắt tóc, gội đầu nhanh chóng ngay trên điện thoại.",
  applicationName: "Đặt Chỗ Salon",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Đặt Chỗ Salon",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-icon-180.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Không đặt maximumScale: iOS Safari hay tính sai initial-scale sau khi load
  // (trang bị phóng to, phải pinch lại) và còn chặn zoom trợ năng.
  themeColor: "#fbfaf8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${montserrat.variable} ${cormorant.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors position="top-center" />
        <PwaRegister />
      </body>
    </html>
  );
}
