"use client";

import { useState } from "react";

import { toast } from "sonner";

import { authClient } from "@/lib/auth/client";
import { resolveLoginEmail } from "@/lib/phone-login";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Cho phép đăng nhập bằng SĐT (mặc định) hoặc email.
    const { error } = await authClient.signIn.email({
      email: resolveLoginEmail(email),
      password,
    });

    if (error) {
      toast.error("Đăng nhập thất bại", {
        description: "Số điện thoại hoặc mật khẩu không đúng.",
      });
      setLoading(false);
      return;
    }
    // Hard navigation: server đọc session tươi rồi vào dashboard (tránh treo soft-nav).
    window.location.assign("/admin");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Đăng nhập quản trị</CardTitle>
          <CardDescription>Khu vực dành cho chủ salon.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Số điện thoại</Label>
              <Input
                id="email"
                type="text"
                inputMode="tel"
                autoComplete="username"
                placeholder="VD: 0901234567"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
