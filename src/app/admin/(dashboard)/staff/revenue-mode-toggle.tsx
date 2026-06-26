"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { saveRevenueMode } from "./actions";

type RevenueMode = "per_staff" | "combined";

interface RevenueModeToggleProps {
  mode: RevenueMode;
}

const OPTIONS: { value: RevenueMode; label: string }[] = [
  { value: "per_staff", label: "Chia theo thợ" },
  { value: "combined", label: "Gộp" },
];

export function RevenueModeToggle({ mode }: RevenueModeToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSelect = (next: RevenueMode) => {
    if (next === mode) return;
    startTransition(async () => {
      const result = await saveRevenueMode(next);
      if (result.ok) {
        toast.success("Đã lưu chế độ doanh thu");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="py-4 space-y-3">
        <div>
          <p className="text-sm font-semibold">Chế độ doanh thu</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {mode === "per_staff"
              ? "Chia theo thợ: xem doanh thu từng thợ."
              : "Gộp: chỉ xem tổng."}
          </p>
        </div>
        <div className="flex gap-2">
          {OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={mode === opt.value ? "default" : "outline"}
              disabled={isPending}
              onClick={() => handleSelect(opt.value)}
              className={cn("rounded-full", mode === opt.value && "pointer-events-none")}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
