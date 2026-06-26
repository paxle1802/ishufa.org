"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaymentQr } from "@/components/admin/payment-qr";

interface CollectPaymentProps {
  bankBin: string;
  accountNumber: string;
  accountName: string;
}

/** Nhập số tiền + nội dung → hiện VietQR. */
export function CollectPayment({ bankBin, accountNumber, accountName }: CollectPaymentProps) {
  const [amountText, setAmountText] = useState("");
  const [note, setNote] = useState("");
  const [shown, setShown] = useState<{ amount: number; note: string } | null>(null);

  const amount = Number(amountText.replace(/\D/g, ""));

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="space-y-1">
            <Label htmlFor="amount">Số tiền (đ)</Label>
            <Input
              id="amount"
              inputMode="numeric"
              value={amountText}
              onChange={(e) => setAmountText(e.target.value.replace(/\D/g, ""))}
              placeholder="VD: 150000"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="note">Nội dung (tuỳ chọn)</Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Cat toc"
            />
          </div>
          <Button
            className="w-full"
            disabled={!amount || amount <= 0}
            onClick={() => setShown({ amount, note })}
          >
            Tạo mã QR
          </Button>
        </CardContent>
      </Card>

      {shown && (
        <Card>
          <CardContent className="pt-6">
            <PaymentQr
              bankBin={bankBin}
              accountNumber={accountNumber}
              accountName={accountName}
              amount={shown.amount}
              addInfo={shown.note || undefined}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
