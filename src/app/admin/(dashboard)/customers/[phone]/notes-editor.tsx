"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { saveCustomerNotes } from "../actions";

interface Props {
  customerId: string;
  notes: string;
}

export function NotesEditor({ customerId, notes }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const value = (data.get("notes") as string) ?? "";

    startTransition(async () => {
      const result = await saveCustomerNotes(customerId, value);
      if (result.ok) {
        toast.success("Đã lưu ghi chú");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        name="notes"
        defaultValue={notes}
        rows={3}
        maxLength={1000}
        placeholder="Ghi chú về khách hàng…"
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
      />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Đang lưu…" : "Lưu ghi chú"}
      </Button>
    </form>
  );
}
