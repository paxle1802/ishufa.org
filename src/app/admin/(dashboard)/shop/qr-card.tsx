"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { ImageDown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { saveOrShareImage } from "@/lib/save-image";

interface QrCardProps {
  appUrl: string;
  slug: string;
  shopName: string;
}

const QR_SIZE = 240; // canvas hiển thị trên màn hình
const EXPORT_SIZE = 1024; // QR xuất ra để in (nét)
const EXPORT_FONT = 64; // cỡ chữ tên shop khi xuất
const EXPORT_PAD = 40; // đệm trên/dưới tên shop khi xuất

export function QrCard({ appUrl, slug, shopName }: QrCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [saving, setSaving] = useState(false);
  const targetUrl = `${appUrl}/s/${slug}`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    QRCode.toCanvas(canvas, targetUrl, {
      width: QR_SIZE,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    }).catch((err) => {
      console.error("[QrCard] QRCode.toCanvas error", err);
    });
  }, [targetUrl]);

  /**
   * Render QR ở độ phân giải cao (1024px) + tên shop bên dưới rồi trả Blob PNG.
   * Vẽ MỚI ở EXPORT_SIZE thay vì phóng to canvas hiển thị 240px (tránh nhoè khi in).
   */
  async function buildImageBlob(): Promise<Blob | null> {
    // 1) Vẽ QR nét vào canvas tạm ở độ phân giải xuất.
    const qrCanvas = document.createElement("canvas");
    await QRCode.toCanvas(qrCanvas, targetUrl, {
      width: EXPORT_SIZE,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });

    // 2) Ghép tên shop bên dưới.
    const captionHeight = EXPORT_FONT + EXPORT_PAD * 2;
    const dl = document.createElement("canvas");
    dl.width = EXPORT_SIZE;
    dl.height = EXPORT_SIZE + captionHeight;

    const ctx = dl.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, dl.width, dl.height);
    ctx.drawImage(qrCanvas, 0, 0, EXPORT_SIZE, EXPORT_SIZE);

    ctx.fillStyle = "#0f172a";
    ctx.font = `bold ${EXPORT_FONT}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      shopName,
      EXPORT_SIZE / 2,
      EXPORT_SIZE + EXPORT_PAD + EXPORT_FONT / 2,
      EXPORT_SIZE - EXPORT_PAD * 2,
    );

    return new Promise((resolve) => dl.toBlob(resolve, "image/png"));
  }

  /** iOS → share sheet "Save Image"; desktop → tải PNG (xem @/lib/save-image). */
  async function handleSave() {
    setSaving(true);
    try {
      const blob = await buildImageBlob();
      if (!blob) return;
      await saveOrShareImage(blob, `qr-${slug}.png`, `Mã QR đặt lịch ${shopName}`);
    } catch (err) {
      console.error("[QrCard] save error", err);
      toast.error("Không lưu được ảnh QR, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mã QR đặt lịch</CardTitle>
        <CardDescription className="break-all text-xs">{targetUrl}</CardDescription>
      </CardHeader>

      <CardContent className="flex justify-center">
        <canvas ref={canvasRef} width={QR_SIZE} height={QR_SIZE} className="rounded-md" />
      </CardContent>

      <CardFooter>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="w-full gap-2"
        >
          <ImageDown />
          {saving ? "Đang lưu..." : "Lưu vào ảnh"}
        </Button>
      </CardFooter>
    </Card>
  );
}
