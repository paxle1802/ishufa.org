import { eq } from "drizzle-orm";

import { AdminNav } from "@/components/admin/admin-nav";
import { db } from "@/lib/db";
import { shops } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/require-admin";

/**
 * Shell admin được bảo vệ: requireAdmin chặn truy cập chưa đăng nhập.
 * Login page nằm ngoài route group (dashboard) nên không bị shell này bọc.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, shopId } = await requireAdmin();
  const shop = await db.query.shops.findFirst({
    where: eq(shops.id, shopId),
    columns: { name: true },
  });

  return (
    <div className="flex min-h-dvh flex-col pb-16">
      <header className="sticky top-0 z-30 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <span className="font-semibold">{shop?.name ?? "Salon"}</span>
          <span className="text-sm text-muted-foreground">{user.name}</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">{children}</main>
      <AdminNav />
    </div>
  );
}
