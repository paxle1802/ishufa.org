import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireSession } from "@/lib/auth/require-admin";
import { ChangePasswordForm } from "./change-password-form";

/** Trang đổi mật khẩu bắt buộc (lần đầu / sau khi super admin reset). */
export default async function ChangePasswordPage() {
  const { user } = await requireSession();
  if ((user as { role?: string }).role === "super_admin") redirect("/super");

  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Đổi mật khẩu</CardTitle>
          <CardDescription>
            Vì lý do bảo mật, vui lòng đặt mật khẩu mới để tiếp tục.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </main>
  );
}
