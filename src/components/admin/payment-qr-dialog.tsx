"use client";

import { useState } from "react";

import { QrCode } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaymentQr } from "@/components/admin/payment-qr";

interface PaymentQrDialogProps {
  bankBin: string;
  accountNumber: string;
  accountName: string;
  amount?: number;
  addInfo?: string;
  label?: string;
}

/** Nút mở dialog hiển thị mã VietQR thu tiền (dùng ở danh sách booking). */
export function PaymentQrDialog({
  bankBin,
  accountNumber,
  accountName,
  amount,
  addInfo,
  label = "QR thanh toán",
}: PaymentQrDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="gap-1.5">
        <QrCode className="size-4" />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Thanh toán qua VietQR</DialogTitle>
          </DialogHeader>
          <PaymentQr
            bankBin={bankBin}
            accountNumber={accountNumber}
            accountName={accountName}
            amount={amount}
            addInfo={addInfo}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
