"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatLocal } from "@/lib/tz";
import { cancelPackagePurchase, confirmPackagePurchase } from "./actions";

const vnd = new Intl.NumberFormat("vi-VN");

export interface PurchaseRequest {
  id: string;
  packageName: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  refCode: string;
  createdAt: Date;
}

/** Yêu cầu mua gói online đang chờ chủ shop xác nhận đã nhận tiền. */
export function PurchaseRequests({ requests }: { requests: PurchaseRequest[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (requests.length === 0) return null;

  const confirm = (id: string) =>
    start(async () => {
      const res = await confirmPackagePurchase(id);
      if (res.ok) {
        toast.success("Đã kích hoạt gói cho khách");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });

  const cancel = (id: string) =>
    start(async () => {
      if (!window.confirm("Huỷ yêu cầu mua gói này?")) return;
      const res = await cancelPackagePurchase(id);
      if (res.ok) {
        toast.success("Đã huỷ yêu cầu");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });

  return (
    <div className="space-y-2">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
        Yêu cầu mua gói ({requests.length})
      </h2>
      {requests.map((r) => (
        <Card key={r.id} className="border-amber-300 bg-amber-50 shadow-sm">
          <CardContent className="space-y-2 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold">{r.packageName}</p>
                <p className="text-sm text-muted-foreground">
                  {r.customerName} · {r.customerPhone}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Nội dung CK: <span className="font-mono font-bold">{r.refCode}</span> ·{" "}
                  {formatLocal(r.createdAt, "HH:mm dd-MM-yyyy")}
                </p>
              </div>
              <span className="shrink-0 font-bold">{vnd.format(r.amount)}đ</span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={pending}
                onClick={() => confirm(r.id)}
              >
                Đã nhận tiền → kích hoạt
              </Button>
              <Button size="sm" variant="outline" disabled={pending} onClick={() => cancel(r.id)}>
                Huỷ
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
