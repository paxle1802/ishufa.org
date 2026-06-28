"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { customerLogin } from "./actions";

/** Form đăng nhập khách (SĐT + mật khẩu do salon cấp). */
export function CustomerLoginForm({ slug, shopName }: { slug: string; shopName: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await customerLogin(slug, phone.trim(), password);
      if (res.ok) {
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <a
        href={`/s/${slug}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        ← Về trang đặt lịch
      </a>

      <h1 className="font-heading text-3xl font-semibold">Trang của tôi</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Đăng nhập để xem gói combo, số dư & điểm thưởng tại {shopName}.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="cust-phone">Số điện thoại</Label>
          <Input
            id="cust-phone"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0912345678"
            autoComplete="username"
            disabled={pending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cust-pw">Mật khẩu</Label>
          <Input
            id="cust-pw"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mật khẩu salon cấp"
            autoComplete="current-password"
            disabled={pending}
          />
        </div>
        <Button
          type="submit"
          disabled={pending || !phone.trim() || !password}
          className="h-12 w-full rounded-full text-base font-bold"
        >
          {pending ? "Đang đăng nhập…" : "Đăng nhập"}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Chưa có mật khẩu hoặc quên? Nhờ salon đặt/cấp lại giúp bạn.
      </p>
    </div>
  );
}
