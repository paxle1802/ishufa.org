"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

const DISPLAY = 160;

/**
 * Khối "Trang của tôi" trên màn đặt-lịch-thành-công: link + QR mở /kh/[token]
 * để khách xem combo, điểm, lịch sử. QR để khách chụp/lưu lại dùng sau.
 */
export function MyPageLink({ token }: { token: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const href = `/kh/${token}`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = `${window.location.origin}${href}`;
    QRCode.toCanvas(canvas, url, {
      width: DISPLAY,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    }).catch((err) => console.error("[MyPageLink] toCanvas", err));
  }, [href]);

  return (
    <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-border p-5 text-center">
      <p className="text-sm font-semibold">Trang của bạn</p>
      <p className="text-xs text-muted-foreground">
        Xem gói combo còn buổi, điểm thưởng và lịch sử đặt. Lưu lại mã này để xem sau.
      </p>
      <canvas
        ref={canvasRef}
        width={DISPLAY}
        height={DISPLAY}
        className="h-auto max-w-full rounded-lg border bg-white p-2"
      />
      <a
        href={href}
        className="flex h-11 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-lg transition-opacity hover:opacity-90"
      >
        Xem combo &amp; điểm của tôi
      </a>
    </div>
  );
}
