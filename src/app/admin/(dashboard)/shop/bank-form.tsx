"use client";

import { useState, useTransition } from "react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Shop } from "@/lib/db/schema";
import { normalizeAccountName } from "@/lib/vietqr/account-name";
import { BANKS } from "@/lib/vietqr/banks";

import { saveBankInfo } from "./actions";

/** Tài khoản nhận tiền (VietQR) — dùng để tạo QR thu tiền mỗi lần xong dịch vụ. */
export function BankForm({ shop }: { shop: Shop }) {
  const [bankBin, setBankBin] = useState(shop.bankBin ?? "");
  const [accountNumber, setAccountNumber] = useState(shop.bankAccountNumber ?? "");
  const [accountName, setAccountName] = useState(shop.bankAccountName ?? "");
  const [saving, startSaving] = useTransition();

  function handleSave() {
    startSaving(async () => {
      const res = await saveBankInfo({
        bankBin,
        bankAccountNumber: accountNumber,
        bankAccountName: accountName,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã lưu tài khoản nhận tiền");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tài khoản nhận tiền (VietQR)</CardTitle>
        <CardDescription>
          Khai báo để app tạo mã QR cho khách chuyển khoản mỗi khi xong dịch vụ.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="bank-bin">Ngân hàng</Label>
          <select
            id="bank-bin"
            value={bankBin}
            onChange={(e) => setBankBin(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <option value="">— Chọn ngân hàng —</option>
            {BANKS.map((b) => (
              <option key={b.bin} value={b.bin}>
                {b.short} — {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="bank-account-number">Số tài khoản</Label>
          <Input
            id="bank-account-number"
            inputMode="numeric"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
            placeholder="VD: 0123456789"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="bank-account-name">Tên chủ tài khoản</Label>
          <Input
            id="bank-account-name"
            value={accountName}
            onChange={(e) => setAccountName(normalizeAccountName(e.target.value))}
            placeholder="VD: NGUYEN THI HUONG"
            autoCapitalize="characters"
          />
        </div>
      </CardContent>

      <CardFooter>
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Đang lưu..." : "Lưu tài khoản"}
        </Button>
      </CardFooter>
    </Card>
  );
}
