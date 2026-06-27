"use client";

import { useEffect, useRef, useState } from "react";

import QRCode from "qrcode";

import { saveOrShareImage } from "@/lib/save-image";

const DISPLAY = 200;
const EXPORT = 768;

/** Mã QR đặt chỗ cho khách lưu lại; tới salon giơ ra để shop quét. */
export function CheckinQr({ token, shortCode }: { token: string; shortCode: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    QRCode.toCanvas(canvas, token, {
      width: DISPLAY,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    }).catch((err) => console.error("[CheckinQr] toCanvas", err));
  }, [token]);

  async function handleSave() {
    setSaving(true);
    try {
      // Vẽ QR nét + mã code bên dưới rồi lưu/chia sẻ.
      const qr = document.createElement("canvas");
      await QRCode.toCanvas(qr, token, { width: EXPORT, margin: 2 });
      const pad = 48;
      const out = document.createElement("canvas");
      out.width = EXPORT;
      out.height = EXPORT + pad * 2;
      const ctx = out.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, out.width, out.height);
      ctx.drawImage(qr, 0, 0, EXPORT, EXPORT);
      ctx.fillStyle = "#0f172a";
      ctx.font = `bold 44px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`Mã: ${shortCode}`, EXPORT / 2, EXPORT + pad);
      const blob = await new Promise<Blob | null>((r) => out.toBlob(r, "image/png"));
      if (blob) await saveOrShareImage(blob, `dat-cho-${shortCode}.png`, "Mã QR đặt chỗ");
    } catch (err) {
      console.error("[CheckinQr] save", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-border p-5 text-center">
      <p className="text-sm font-semibold">Mã QR đặt chỗ của bạn</p>
      <canvas
        ref={canvasRef}
        width={DISPLAY}
        height={DISPLAY}
        className="h-auto max-w-full rounded-lg border bg-white p-2"
      />
      <p className="text-xs text-muted-foreground">
        Vui lòng lưu lại mã này. Khi tới salon, chỉ cần giơ mã QR ra để nhân viên quét.
      </p>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="flex h-11 w-full items-center justify-center rounded-full border border-input text-sm font-semibold text-foreground transition-colors hover:bg-muted/60 disabled:opacity-50"
      >
        {saving ? "Đang lưu..." : "Lưu mã QR vào ảnh"}
      </button>
    </div>
  );
}
