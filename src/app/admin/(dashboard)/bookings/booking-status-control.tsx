"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { BookingStatus } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { setBookingStatus } from "./actions";

const OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "arrived", label: "Đã đến" },
  { value: "completed", label: "Hoàn tất" },
  { value: "no_show", label: "Vắng mặt" },
  { value: "cancelled", label: "Đã huỷ" },
];

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
  // Khi hoàn tất và khách có gói → chờ admin chọn gói trước khi áp dụng.
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
      else toast.success("Đã cập nhật trạng thái");
      setChoosingPkg(false);
      setPkgId("");
      router.refresh();
    });
  }

  function onSelect(next: BookingStatus) {
    if (next === status) return;
    if (next === "completed" && activePackages.length > 0) {
      setChoosingPkg(true); // mở panel chọn gói
      return;
    }
    apply(next);
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <select
        aria-label="Đổi trạng thái booking"
        value={status}
        disabled={pending}
        onChange={(e) => onSelect(e.target.value as BookingStatus)}
        className={cn(
          "h-9 rounded-lg border border-input bg-background px-2 text-sm outline-none",
          "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
          pending && "opacity-50",
        )}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {choosingPkg && (
        <div className="flex w-full flex-col gap-2 rounded-lg border bg-muted/40 p-2">
          <span className="text-xs text-muted-foreground">Trừ gói combo (nếu có):</span>
          <select
            value={pkgId}
            onChange={(e) => setPkgId(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
          >
            <option value="">Không trừ gói</option>
            {activePackages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name ?? "Gói"} (còn {p.sessionsRemaining})
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => apply("completed", pkgId || undefined)}
              className="h-8 flex-1 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Xác nhận hoàn tất
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setChoosingPkg(false)}
              className="h-8 rounded-lg border px-3 text-sm"
            >
              Huỷ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
