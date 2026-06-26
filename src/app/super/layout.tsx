import { requireSuperAdmin } from "@/lib/auth/require-admin";

export default async function SuperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSuperAdmin();

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b bg-card/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-2xl">
          <span className="font-semibold text-foreground">Quản trị nền tảng</span>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-4">{children}</main>
    </div>
  );
}
