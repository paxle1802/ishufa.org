"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Closure } from "@/lib/db/schema";
import { addClosure, deleteClosure } from "./actions";

interface Props {
  closures: Closure[];
}

export function ClosuresManager({ closures: initial }: Props) {
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [isPendingAdd, startAdd] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleAdd() {
    if (!date) {
      toast.error("Vui lòng chọn ngày");
      return;
    }
    startAdd(async () => {
      const result = await addClosure({ date, reason });
      if (result.ok) {
        toast.success("Đã thêm ngày nghỉ");
        setDate("");
        setReason("");
      } else {
        toast.error(result.error);
      }
    });
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const result = await deleteClosure(id);
      if (result.ok) {
        toast.success("Đã xoá ngày nghỉ");
      } else {
        toast.error(result.error);
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ngày nghỉ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add form */}
        <div className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="min-w-0 space-y-1 sm:flex-1">
              <Label htmlFor="closure-date" className="text-xs">
                Ngày
              </Label>
              <input
                id="closure-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 w-full rounded-md border px-3 text-sm"
              />
            </div>
            <div className="min-w-0 space-y-1 sm:flex-[2]">
              <Label htmlFor="closure-reason" className="text-xs">
                Lý do (tuỳ chọn)
              </Label>
              <Input
                id="closure-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Lễ, sự kiện…"
              />
            </div>
          </div>
          <Button
            onClick={handleAdd}
            disabled={isPendingAdd}
            variant="outline"
            className="w-full"
          >
            {isPendingAdd ? "Đang thêm…" : "Thêm ngày nghỉ"}
          </Button>
        </div>

        {/* List */}
        {initial.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có ngày nghỉ nào.</p>
        ) : (
          <ul className="divide-y text-sm">
            {initial.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2">
                <div>
                  <span className="font-medium tabular-nums">{c.date}</span>
                  {c.reason && (
                    <span className="ml-2 text-muted-foreground">{c.reason}</span>
                  )}
                </div>
                <button
                  type="button"
                  disabled={deletingId === c.id}
                  onClick={() => handleDelete(c.id)}
                  className="text-muted-foreground hover:text-destructive disabled:opacity-40"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
