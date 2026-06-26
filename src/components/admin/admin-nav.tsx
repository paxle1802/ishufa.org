"use client";

import {
  CalendarClock,
  CalendarDays,
  LayoutGrid,
  LogOut,
  Scissors,
  Store,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Hôm nay", icon: LayoutGrid },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/admin/services", label: "Dịch vụ", icon: Scissors },
  { href: "/admin/schedule", label: "Lịch", icon: CalendarClock },
  { href: "/admin/shop", label: "Shop & QR", icon: Store },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
        <li className="flex-1">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="size-5" aria-hidden />
            Thoát
          </button>
        </li>
      </ul>
    </nav>
  );
}
