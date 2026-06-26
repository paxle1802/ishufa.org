"use client";

import { useState, useTransition } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cancelAction } from "./actions";

const REASON: Record<string, string> = {
  not_found: "Không tìm thấy lịch hẹn.",
  already: "Lịch hẹn đã được xử lý trước đó.",
  cutoff: "Đã quá hạn huỷ, vui lòng gọi salon.",
};

export function CancelConfirm({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  if (done) {
    return (
      <p className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-center text-sm text-green-300">
        Đã huỷ lịch hẹn thành công.
      </p>
    );
  }

  function confirm() {
    start(async () => {
      const res = await cancelAction(token);
      if (res.ok) {
        setDone(true);
        toast.success("Đã huỷ lịch hẹn");
      } else {
        toast.error(REASON[res.reason] ?? "Huỷ thất bại");
      }
    });
  }

  return (
    <Button
      type="button"
      variant="destructive"
      className="w-full"
      disabled={pending}
      onClick={confirm}
    >
      {pending ? "Đang huỷ..." : "Xác nhận huỷ lịch"}
    </Button>
  );
}
