"use client";

import { CalendarDays, LayoutGrid, QrCode } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

import { haptic } from "@/lib/haptic";
import { cn } from "@/lib/utils";
import { MoreMenu } from "./more-menu";

const NAV_ITEMS = [
  { href: "/admin", label: "Hôm nay", icon: LayoutGrid },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/admin/thu-tien", label: "Thanh toán", icon: QrCode },
] as const;

/**
 * Nội dung 1 mục nav. useLinkStatus cho biết link vừa bấm đang điều hướng
 * → sáng lên NGAY khi chạm (không đợi server trả về), giống app native.
 */
function NavItemContent({
  label,
  Icon,
  active,
}: {
  label: string;
  Icon: LucideIcon;
  active: boolean;
}) {
  const { pending } = useLinkStatus();
  const hot = active || pending;
  return (
    <span
      className={cn(
        "flex flex-col items-center gap-0.5 py-1.5 text-[13px] font-bold transition-colors",
        hot ? "text-foreground" : "text-foreground/70",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-12 items-center justify-center rounded-full transition-colors",
          // AURA: mục đang mở / vừa bấm = nền vàng nhạt + icon vàng đồng.
          hot ? "bg-accent/15 text-accent" : "text-foreground/70",
        )}
      >
        <Icon className="size-7" aria-hidden />
      </span>
      {label}
    </span>
  );
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background">
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link href={href} className="block" onClick={() => haptic()}>
                <NavItemContent label={label} Icon={Icon} active={active} />
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
