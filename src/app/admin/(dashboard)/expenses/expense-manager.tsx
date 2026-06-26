"use client";

import { useState, useTransition } from "react";

import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addExpense, deleteExpense } from "./actions";

const vnd = new Intl.NumberFormat("vi-VN");

interface ExpenseRow {
  id: string;
  amount: number;
  note: string | null;
}

export function ExpenseManager({ expenses }: { expenses: ExpenseRow[] }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount.replace(/\D/g, ""));
    if (!amt) return;
    startTransition(async () => {
      const res = await addExpense(amt, note);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã thêm chi phí");
      setAmount("");
      setNote("");
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteExpense(id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleAdd} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
            placeholder="Số tiền (đ)"
            className="w-36"
          />
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nội dung (VD: mua dầu gội)"
            className="flex-1"
          />
        </div>
        <Button type="submit" disabled={pending || !amount} className="w-full">
          Thêm chi phí hôm nay
        </Button>
      </form>

      {expenses.length === 0 ? (
        <p className="rounded-xl border border-dashed py-6 text-center text-sm text-muted-foreground">
          Chưa có chi phí nào hôm nay.
        </p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {expenses.map((e) => (
            <li key={e.id} className="flex items-center gap-3 px-3 py-2.5">
              <span className="min-w-0 flex-1 truncate text-sm">
                {e.note || "Chi phí"}
              </span>
              <span className="shrink-0 text-sm font-semibold">−{vnd.format(e.amount)}đ</span>
              <Button
                size="icon-sm"
                variant="ghost"
                disabled={pending}
                onClick={() => handleDelete(e.id)}
                title="Xoá"
              >
                <Trash2Icon />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
