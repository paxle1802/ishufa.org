"use client";

import { useRef, useState, useTransition } from "react";

import { QrCode, ScanLine } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { BookingStatus } from "@/lib/db/schema";
import { formatLocal } from "@/lib/tz";
import { setBookingStatus } from "../bookings/actions";
import { lookupBookingByCode, type ScannedBooking } from "./actions";

const vnd = new Intl.NumberFormat("vi-VN");
const STATUS_LABEL: Record<BookingStatus, string> = {
  confirmed: "Đã xác nhận",
  arrived: "Đã đến",
  completed: "Hoàn tất",
  no_show: "Vắng mặt",
  cancelled: "Đã huỷ",
};
const STATUS_CLASS: Record<BookingStatus, string> = {
  confirmed: "bg-blue-100 text-blue-700",
  arrived: "bg-violet-100 text-violet-700",
  completed: "bg-green-100 text-green-700",
  no_show: "bg-amber-100 text-amber-700",
  cancelled: "bg-muted text-muted-foreground",
};
const READER_ID = "checkin-reader";

export function CheckinScanner() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScannedBooking | null>(null);
  const [manual, setManual] = useState("");
  const [pending, startTransition] = useTransition();
  // Giữ instance Html5Qrcode để dừng camera.
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);

  async function stopCamera() {
    const s = scannerRef.current;
    scannerRef.current = null;
    if (s) {
      try {
        await s.stop();
        s.clear();
      } catch {
        /* đã dừng */
      }
    }
    setScanning(false);
  }

  function doLookup(code: string) {
    startTransition(async () => {
      const res = await lookupBookingByCode(code);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setResult(res.booking);
      setManual("");
    });
  }

  async function startCamera() {
    setResult(null);
    setScanning(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(READER_ID);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          void stopCamera();
          doLookup(decoded);
        },
        () => {
          /* bỏ qua khung không đọc được */
        },
      );
    } catch (err) {
      console.error("[CheckinScanner] start", err);
      toast.error("Không mở được camera. Kiểm tra quyền truy cập camera.");
      setScanning(false);
    }
  }

  function markArrived() {
    if (!result) return;
    startTransition(async () => {
      const res = await setBookingStatus(result.id, "arrived");
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã xác nhận khách đến");
      setResult({ ...result, status: "arrived" });
    });
  }

  return (
    <div className="space-y-4">
      {!result && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            {/* Vùng camera */}
            <div
              id={READER_ID}
              className="mx-auto w-full max-w-xs overflow-hidden rounded-xl bg-muted"
              style={{ minHeight: scanning ? 240 : 0 }}
            />

            {scanning ? (
              <Button variant="outline" className="w-full" onClick={stopCamera}>
                Dừng quét
              </Button>
            ) : (
              <Button className="w-full gap-2" onClick={startCamera}>
                <ScanLine className="size-4" />
                Quét mã QR khách
              </Button>
            )}

            {/* Nhập tay mã ngắn (in trên màn của khách) */}
            <div className="flex gap-2 pt-1">
              <Input
                value={manual}
                onChange={(e) => setManual(e.target.value.trim())}
                placeholder="Hoặc nhập mã đặt lịch"
              />
              <Button
                variant="outline"
                disabled={pending || manual.length < 4}
                onClick={() => doLookup(manual)}
              >
                Tra cứu
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-lg font-semibold">{result.customerName}</p>
                <a
                  href={`tel:${result.customerPhone}`}
                  className="text-sm text-muted-foreground"
                >
                  {result.customerPhone}
                </a>
              </div>
              <Badge className={STATUS_CLASS[result.status]}>
                {STATUS_LABEL[result.status]}
              </Badge>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="font-medium capitalize">
                {formatLocal(new Date(result.startAt), "HH:mm 'ngày' dd/MM/yyyy")}
              </p>
              <p className="mt-1 text-muted-foreground">
                {result.serviceNames.join(", ")}
              </p>
              <p className="mt-1 font-semibold">{vnd.format(result.totalPrice)}đ</p>
            </div>

            {result.status === "confirmed" && (
              <Button className="w-full" disabled={pending} onClick={markArrived}>
                Xác nhận khách đã tới
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setResult(null)}
            >
              <QrCode className="size-4" />
              Quét khách tiếp theo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
