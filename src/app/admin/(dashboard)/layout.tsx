import { eq } from "drizzle-orm";

import { AdminNav } from "@/components/admin/admin-nav";
import { NotificationToggle } from "@/components/admin/notification-toggle";
import { PageTransition } from "@/components/admin/page-transition";
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
      <header className="sticky top-0 z-30 border-b bg-background px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <span className="min-w-0 flex-1 truncate font-semibold">{shop?.name ?? "Salon"}</span>
          <span className="shrink-0 text-sm text-muted-foreground">{user.name}</span>
          <NotificationToggle />
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        <PageTransition>{children}</PageTransition>
      </main>
      <AdminNav />
    </div>
  );
}
