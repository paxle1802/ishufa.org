"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaymentQr } from "@/components/admin/payment-qr";
import { cn } from "@/lib/utils";
import { normalizePhone } from "@/lib/validation/booking";
import { createPackagePurchase, type PurchaseResult } from "./actions";

const vnd = new Intl.NumberFormat("vi-VN");

export interface BuyablePackage {
  id: string;
  name: string;
  kind: string;
  price: number;
  sessions: number;
  validityDays: number;
}

export function PackageBuy({
  slug,
  packages,
}: {
  slug: string;
  packages: BuyablePackage[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState<Extract<PurchaseResult, { ok: true }> | null>(null);
  const [donePkg, setDonePkg] = useState<BuyablePackage | null>(null);
  const [pending, start] = useTransition();

  // Prefill tên + SĐT từ lần trước trên thiết bị.
  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem("shufa-customer") || "{}");
      if (c.name) setName(c.name);
      if (c.phone) setPhone(normalizePhone(c.phone));
    } catch {
      /* ignore */
    }
  }, []);

  const selected = packages.find((p) => p.id === selectedId) ?? null;

  const submit = () => {
    if (!selected) return;
    start(async () => {
      const res = await createPackagePurchase(slug, selected.id, name.trim(), phone.trim());
      if (res.ok) {
        setDone(res);
        setDonePkg(selected);
      } else {
        toast.error(res.error);
      }
    });
  };

  // Màn chờ chuyển khoản — hiện VietQR + nội dung CK.
  if (done && donePkg) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5 text-center">
          <p className="font-heading text-2xl font-semibold">Quét mã để thanh toán</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {donePkg.name} · {vnd.format(done.amount)}đ
          </p>
          <div className="mt-4 flex justify-center">
            <PaymentQr
              bankBin={done.bank.bankBin}
              accountNumber={done.bank.accountNumber}
              accountName={done.bank.accountName}
              amount={done.amount}
              addInfo={done.refCode}
            />
          </div>
          <div className="mt-3 rounded-xl bg-muted/60 px-3 py-2.5 text-left text-sm">
            <p className="text-muted-foreground">Nội dung chuyển khoản (giữ nguyên):</p>
            <p className="font-mono text-base font-bold tracking-wider">{done.refCode}</p>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Sau khi chuyển khoản, salon sẽ xác nhận và kích hoạt gói cho bạn. Liên hệ
            salon để lấy mật khẩu đăng nhập xem gói.
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setDone(null);
            setDonePkg(null);
            setSelectedId(null);
          }}
        >
          Mua gói khác
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="flex flex-col gap-2.5">
        {packages.map((p) => {
          const active = selectedId === p.id;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-colors",
                  active ? "border-primary ring-2 ring-primary" : "border-border hover:bg-muted/40",
                )}
              >
                <span className="min-w-0">
                  <span className="block font-semibold">{p.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {p.kind === "prepaid" ? "Nạp tiền" : `${p.sessions} buổi`} · HSD{" "}
                    {p.validityDays} ngày
                  </span>
                </span>
                <span className="shrink-0 font-bold text-primary">
                  {vnd.format(p.price)}đ
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="buy-name">Tên của bạn</Label>
          <Input id="buy-name" value={name} onChange={(e) => setName(e.target.value)} disabled={pending} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="buy-phone">Số điện thoại</Label>
          <Input
            id="buy-phone"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={(e) => setPhone(normalizePhone(e.target.value))}
            placeholder="0912345678"
            disabled={pending}
          />
        </div>
      </div>

      <Button
        className="h-12 w-full rounded-full text-base font-bold"
        disabled={pending || !selected || !name.trim() || !phone.trim()}
        onClick={submit}
      >
        {pending ? "Đang tạo…" : selected ? `Mua · ${vnd.format(selected.price)}đ` : "Chọn gói"}
      </Button>
    </div>
  );
}
