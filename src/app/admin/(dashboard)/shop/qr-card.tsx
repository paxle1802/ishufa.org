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

interface QrCardProps {
  appUrl: string;
  slug: string;
  shopName: string;
}

const QR_SIZE = 240;
const FONT_SIZE = 16;
const CAPTION_PAD = 12;

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

  /** Vẽ QR + tên shop ra canvas rồi trả về Blob PNG. */
  function buildImageBlob(): Promise<Blob | null> {
    const sourceCanvas = canvasRef.current;
    if (!sourceCanvas) return Promise.resolve(null);

    const captionHeight = FONT_SIZE + CAPTION_PAD * 2;
    const dl = document.createElement("canvas");
    dl.width = QR_SIZE;
    dl.height = QR_SIZE + captionHeight;

    const ctx = dl.getContext("2d");
    if (!ctx) return Promise.resolve(null);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, dl.width, dl.height);
    ctx.drawImage(sourceCanvas, 0, 0, QR_SIZE, QR_SIZE);

    ctx.fillStyle = "#0f172a";
    ctx.font = `${FONT_SIZE}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(shopName, QR_SIZE / 2, QR_SIZE + CAPTION_PAD + FONT_SIZE / 2, QR_SIZE - 16);

    return new Promise((resolve) => dl.toBlob(resolve, "image/png"));
  }

  function downloadBlob(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${slug}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * iOS: dùng Web Share API (file ảnh) → share sheet có "Save Image" lưu vào
   * Photos. Desktop/không hỗ trợ chia sẻ file → tải PNG.
   */
  async function handleSave() {
    setSaving(true);
    try {
      const blob = await buildImageBlob();
      if (!blob) return;

      const file = new File([blob], `qr-${slug}.png`, { type: "image/png" });
      const nav = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
      };

      if (nav.canShare?.({ files: [file] })) {
        try {
          await nav.share({ files: [file], title: `Mã QR đặt lịch ${shopName}` });
          return;
        } catch (err) {
          // Người dùng huỷ share sheet → không coi là lỗi.
          if (err instanceof DOMException && err.name === "AbortError") return;
          // Lỗi khác → rơi xuống tải file.
        }
      }

      downloadBlob(blob);
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
