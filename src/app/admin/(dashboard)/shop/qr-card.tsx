"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";

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

  function handleDownload() {
    const sourceCanvas = canvasRef.current;
    if (!sourceCanvas) return;

    // Build a download canvas: QR + caption text below
    const captionHeight = FONT_SIZE + CAPTION_PAD * 2;
    const dl = document.createElement("canvas");
    dl.width = QR_SIZE;
    dl.height = QR_SIZE + captionHeight;

    const ctx = dl.getContext("2d");
    if (!ctx) return;

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, dl.width, dl.height);

    // Copy QR from the displayed canvas
    ctx.drawImage(sourceCanvas, 0, 0, QR_SIZE, QR_SIZE);

    // Draw shop name caption
    ctx.fillStyle = "#0f172a";
    ctx.font = `${FONT_SIZE}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      shopName,
      QR_SIZE / 2,
      QR_SIZE + CAPTION_PAD + FONT_SIZE / 2,
      QR_SIZE - 16,
    );

    const a = document.createElement("a");
    a.href = dl.toDataURL("image/png");
    a.download = `qr-${slug}.png`;
    a.click();
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
        <Button variant="outline" size="sm" onClick={handleDownload} className="w-full gap-2">
          <Download />
          Tải PNG
        </Button>
      </CardFooter>
    </Card>
  );
}
