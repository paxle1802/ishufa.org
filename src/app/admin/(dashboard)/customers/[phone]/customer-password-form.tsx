"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setCustomerPassword } from "../actions";

/**
 * Chủ shop đặt/đổi mật khẩu cho khách → khách dùng SĐT + mật khẩu này để đăng
 * nhập "Trang của tôi" (xem combo/điểm). Dùng cả khi khách quên (đặt lại).
 */
export function CustomerPasswordForm({
  customerId,
  hasPassword,
}: {
  customerId: string;
  hasPassword: boolean;
}) {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pending, start] = useTransition();

  const save = () => {
    if (pw.trim().length < 4) {
      toast.error("Mật khẩu tối thiểu 4 ký tự");
      return;
    }
    start(async () => {
      const res = await setCustomerPassword(customerId, pw.trim());
      if (res.ok) {
        toast.success("Đã lưu mật khẩu. Báo khách dùng SĐT + mật khẩu này để đăng nhập.");
        setPw("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {hasPassword
          ? "Khách đã có mật khẩu. Nhập mật khẩu mới để đặt lại nếu khách quên."
          : "Khách chưa có tài khoản. Đặt mật khẩu để khách đăng nhập xem combo/điểm."}
      </p>
      <div className="flex gap-2">
        <Input
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder={hasPassword ? "Mật khẩu mới" : "Đặt mật khẩu"}
          disabled={pending}
        />
        <Button size="sm" onClick={save} disabled={pending || pw.trim().length < 4}>
          {hasPassword ? "Đổi" : "Đặt"}
        </Button>
      </div>
    </div>
  );
}
