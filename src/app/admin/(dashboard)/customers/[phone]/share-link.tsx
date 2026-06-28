"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

const DISPLAY = 180;

/**
 * Cho chủ shop chia sẻ lại link "Trang của tôi" của khách (copy + QR) —
 * đường khôi phục khi khách đổi máy / mất link.
 */
export function ShareLink({ token }: { token: string }) {
  const [showQr, setShowQr] = useState(false);
  const [url, setUrl] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setUrl(`${window.location.origin}/kh/${token}`);
  }, [token]);

  useEffect(() => {
    if (!showQr || !canvasRef.current || !url) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: DISPLAY,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    }).catch((err) => console.error("[ShareLink] toCanvas", err));
  }, [showQr, url]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Đã copy link");
    } catch {
      toast.error("Không copy được, hãy copy thủ công");
    }
  }

  return (
    <div className="space-y-3">
      <p className="break-all rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
        {url}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={copy}>
          <Copy className="size-4" /> Copy link
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowQr((v) => !v)}
        >
          <QrCode className="size-4" /> {showQr ? "Ẩn QR" : "Hiện QR"}
        </Button>
      </div>
      {showQr && (
        <canvas
          ref={canvasRef}
          width={DISPLAY}
          height={DISPLAY}
          className="h-auto max-w-full rounded-lg border bg-white p-2"
        />
      )}
    </div>
  );
}
