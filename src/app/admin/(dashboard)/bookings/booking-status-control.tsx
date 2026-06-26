"use client";

import { useState, useTransition } from "react";

import { Check, CircleX, UserCheck, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { BookingStatus } from "@/lib/db/schema";
import { setBookingStatus } from "./actions";

export interface ActivePackage {
  id: string;
  name: string | null;
  sessionsRemaining: number;
}

export function BookingStatusControl({
  bookingId,
  status,
  activePackages = [],
}: {
  bookingId: string;
  status: BookingStatus;
  activePackages?: ActivePackage[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Khi "Tính tiền" mà khách có gói → chờ chọn gói trước khi hoàn tất.
  const [choosingPkg, setChoosingPkg] = useState(false);
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
      setChoosingPkg(false);
      setPkgId("");
      router.refresh();
    });
  }

  function onCheckout() {
    if (activePackages.length > 0) {
      setChoosingPkg(true);
      return;
    }
    apply("completed");
  }

  // Panel chọn gói combo khi tính tiền.
  if (choosingPkg) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border bg-muted/40 p-3">
        <span className="text-sm font-medium">Trừ gói combo (nếu có):</span>
        <select
          value={pkgId}
          onChange={(e) => setPkgId(e.target.value)}
          className="h-11 rounded-lg border border-input bg-background px-3 text-base"
        >
          <option value="">Không trừ gói</option>
          {activePackages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name ?? "Gói"} (còn {p.sessionsRemaining})
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <Button
            disabled={pending}
            onClick={() => apply("completed", pkgId || undefined)}
            className="h-12 bg-emerald-600 text-base font-semibold text-white hover:bg-emerald-700"
          >
            Xác nhận
          </Button>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => setChoosingPkg(false)}
            className="h-12 text-base"
          >
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  const isActive = status === "confirmed" || status === "arrived";

  // Trạng thái cuối (hoàn tất / huỷ / vắng) → cho mở lại để sửa nhầm.
  if (!isActive) {
    return (
      <Button
        variant="outline"
        disabled={pending}
        onClick={() => apply("confirmed")}
        className="h-9 w-full text-sm"
      >
        Mở lại lịch
      </Button>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      <Button
        disabled={pending || status === "arrived"}
        onClick={() => apply("arrived")}
        className="h-14 flex-col gap-1 bg-violet-600 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
      >
        {status === "arrived" ? (
          <Check className="size-5" />
        ) : (
          <UserCheck className="size-5" />
        )}
        {status === "arrived" ? "Đã đến ✓" : "Đã đến"}
      </Button>
      <Button
        disabled={pending}
        onClick={onCheckout}
        className="h-14 flex-col gap-1 bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        <Wallet className="size-5" />
        Tính tiền
      </Button>
      <Button
        disabled={pending}
        onClick={() => apply("cancelled")}
        className="h-14 flex-col gap-1 bg-red-600 text-sm font-semibold text-white hover:bg-red-700"
      >
        <CircleX className="size-5" />
        Huỷ
      </Button>
    </div>
  );
}
