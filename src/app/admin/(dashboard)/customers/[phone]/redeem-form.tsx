"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { redeemPointsAction } from "../actions";

interface Props {
  customerId: string;
  balance: number;
}

export function RedeemForm({ customerId, balance }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const points = Number(data.get("points"));
    const note = (data.get("note") as string) ?? "";

    startTransition(async () => {
      const result = await redeemPointsAction(customerId, points, note);
      if (result.ok) {
        toast.success("Đổi điểm thành công");
        (e.target as HTMLFormElement).reset();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Số dư hiện tại: <strong>{balance} điểm</strong>
      </p>
      <div className="flex gap-2">
        <input
          name="points"
          type="number"
          min={1}
          max={balance}
          required
          placeholder="Số điểm"
          disabled={balance === 0 || isPending}
          className="w-28 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <input
          name="note"
          type="text"
          maxLength={200}
          placeholder="Ghi chú (tuỳ chọn)"
          disabled={balance === 0 || isPending}
          className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
      </div>
      <Button
        type="submit"
        size="sm"
        disabled={balance === 0 || isPending}
      >
        {isPending ? "Đang xử lý…" : "Đổi điểm"}
      </Button>
      {balance === 0 && (
        <p className="text-xs text-muted-foreground">Khách chưa có điểm để đổi.</p>
      )}
    </form>
  );
}
