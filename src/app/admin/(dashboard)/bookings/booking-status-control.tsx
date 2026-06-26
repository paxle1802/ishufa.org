"use client";

import { useState, useTransition } from "react";

import { Check, CircleX, UserCheck, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaymentQr } from "@/components/admin/payment-qr";
import type { BookingStatus } from "@/lib/db/schema";
import { setBookingStatus } from "./actions";
import type { ShopBank } from "./booking-list";

export interface ActivePackage {
  id: string;
  name: string | null;
  sessionsRemaining: number;
}

export function BookingStatusControl({
  bookingId,
  status,
  amount,
  addInfo,
  bank = null,
  activePackages = [],
}: {
  bookingId: string;
  status: BookingStatus;
  amount: number;
  addInfo: string;
  bank?: ShopBank | null;
  activePackages?: ActivePackage[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [payOpen, setPayOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [pkgId, setPkgId] = useState("");

  function apply(next: BookingStatus, customerPackageId?: string) {
    startTransition(async () => {
      const res = await setBookingStatus(
        bookingId,
        next,
        customerPackageId ? { customerPackageId } : undefined,
      );
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      if (res.warning) toast.warning(res.warning);
      else toast.success("Đã cập nhật");
      setPayOpen(false);
      setCancelOpen(false);
      setPkgId("");
      router.refresh();
    });
  }

  const isActive = status === "confirmed" || status === "arrived";

  // Trạng thái cuối (hoàn tất / huỷ / tự huỷ no-show) → mở lại.
  // Phục hồi về "arrived" (khách có mặt) để không bị quét tự-huỷ lại.
  if (!isActive) {
    return (
      <Button
        variant="outline"
        disabled={pending}
        onClick={() => apply("arrived")}
        className="h-9 w-full text-sm"
      >
        Mở lại lịch
      </Button>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <Button
          disabled={pending || status === "arrived"}
          onClick={() => apply("arrived")}
          className="h-14 flex-col gap-1 bg-violet-600 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {status === "arrived" ? <Check className="size-5" /> : <UserCheck className="size-5" />}
          {status === "arrived" ? "Đã đến ✓" : "Đã đến"}
        </Button>
        <Button
          disabled={pending}
          onClick={() => setPayOpen(true)}
          className="h-14 flex-col gap-1 bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Wallet className="size-5" />
          Tính tiền
        </Button>
        <Button
          disabled={pending}
          onClick={() => setCancelOpen(true)}
          className="h-14 flex-col gap-1 bg-red-600 text-sm font-semibold text-white hover:bg-red-700"
        >
          <CircleX className="size-5" />
          Huỷ
        </Button>
      </div>

      {/* Dialog tính tiền: QR cho khách quét + xác nhận hoàn tất */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Tính tiền</DialogTitle>
          </DialogHeader>

          {bank ? (
            <PaymentQr
              bankBin={bank.bankBin}
              accountNumber={bank.accountNumber}
              accountName={bank.accountName}
              amount={amount}
              addInfo={addInfo}
            />
          ) : (
            <p className="rounded-lg bg-muted/50 p-3 text-center text-sm text-muted-foreground">
              Chưa cấu hình tài khoản nhận tiền. Vào Cài đặt → Shop &amp; QR để thêm
              VietQR, hoặc xác nhận hoàn tất bên dưới.
            </p>
          )}

          {activePackages.length > 0 && (
            <div className="space-y-1">
              <span className="text-sm font-medium">Trừ gói combo (nếu có):</span>
              <select
                value={pkgId}
                onChange={(e) => setPkgId(e.target.value)}
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base"
              >
                <option value="">Không trừ gói</option>
                {activePackages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name ?? "Gói"} (còn {p.sessionsRemaining})
                  </option>
                ))}
              </select>
            </div>
          )}

          <DialogFooter className="-mx-0 -mb-0 border-0 bg-transparent p-0">
            <Button
              disabled={pending}
              onClick={() => apply("completed", pkgId || undefined)}
              className="h-12 w-full bg-emerald-600 text-base font-semibold text-white hover:bg-emerald-700"
            >
              Xác nhận đã thanh toán
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận huỷ */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Huỷ lịch hẹn?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn có chắc chắn muốn huỷ lịch hẹn này? Khung giờ sẽ được mở lại cho khách khác.
          </p>
          <DialogFooter className="-mx-0 -mb-0 grid grid-cols-2 gap-2 border-0 bg-transparent p-0">
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => setCancelOpen(false)}
              className="h-12 text-base"
            >
              Không
            </Button>
            <Button
              disabled={pending}
              onClick={() => apply("cancelled")}
              className="h-12 bg-red-600 text-base font-semibold text-white hover:bg-red-700"
            >
              Huỷ lịch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
