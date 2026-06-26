"use client";

import { useEffect, useRef } from "react";

import QRCode from "qrcode";

import { buildVietQrPayload } from "@/lib/vietqr/build-payload";
import { getBankByBin } from "@/lib/vietqr/banks";

const vnd = new Intl.NumberFormat("vi-VN");
const QR_SIZE = 256;

interface PaymentQrProps {
  bankBin: string;
  accountNumber: string;
  accountName: string;
  amount?: number;
  addInfo?: string;
}

/** Hiển thị mã VietQR + thông tin tài khoản để khách quét chuyển khoản. */
export function PaymentQr({
  bankBin,
  accountNumber,
  accountName,
  amount,
  addInfo,
}: PaymentQrProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bank = getBankByBin(bankBin);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const payload = buildVietQrPayload({ bankBin, accountNumber, amount, addInfo });
    QRCode.toCanvas(canvas, payload, {
      width: QR_SIZE,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    }).catch((err) => console.error("[PaymentQr] toCanvas", err));
  }, [bankBin, accountNumber, amount, addInfo]);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        width={QR_SIZE}
        height={QR_SIZE}
        className="rounded-lg border bg-white p-2"
      />
      {amount && amount > 0 ? (
        <p className="text-2xl font-bold">{vnd.format(amount)}đ</p>
      ) : null}
      <div className="w-full space-y-1 rounded-lg bg-muted/50 p-3 text-center text-sm">
        <p className="font-semibold">{bank?.short ?? "Ngân hàng"}</p>
        <p className="font-mono tracking-wide">{accountNumber}</p>
        <p className="uppercase text-muted-foreground">{accountName}</p>
        {addInfo ? (
          <p className="text-xs text-muted-foreground">Nội dung: {addInfo}</p>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Khách mở app ngân hàng, quét QR để chuyển khoản.
      </p>
    </div>
  );
}
