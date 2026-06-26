import { requireSuperAdmin } from "@/lib/auth/require-admin";

import { SignOutButton } from "./sign-out-button";

export default async function SuperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSuperAdmin();

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b bg-card/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <span className="font-semibold text-foreground">Quản trị nền tảng</span>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-4">{children}</main>
    </div>
  );
}
