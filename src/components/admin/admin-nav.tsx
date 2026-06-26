"use client";

import { CalendarDays, LayoutGrid, QrCode, ScanLine } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { MoreMenu } from "./more-menu";

// Mỗi mục một màu riêng để dễ phân biệt + nổi bật.
const NAV_ITEMS = [
  { href: "/admin", label: "Hôm nay", icon: LayoutGrid, color: "text-blue-500", bg: "bg-blue-500/10" },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarDays, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  { href: "/admin/thu-tien", label: "Thanh toán", icon: QrCode, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { href: "/admin/checkin", label: "Quét QR", icon: ScanLine, color: "text-orange-500", bg: "bg-orange-500/10" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, color, bg }) => {
          const active =
            href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1.5 text-[11px] font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-12 items-center justify-center rounded-full transition-colors",
                    active && bg,
                  )}
                >
                  <Icon className={cn("size-6", color)} aria-hidden />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
        <li className="flex-1">
          <MoreMenu />
        </li>
      </ul>
    </nav>
  );
}
