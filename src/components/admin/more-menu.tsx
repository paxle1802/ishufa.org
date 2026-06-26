"use client";

import {
  CalendarClock,
  LineChart,
  LogOut,
  MoreHorizontal,
  Package,
  QrCode,
  ScanLine,
  Store,
  Ticket,
  Users2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { authClient } from "@/lib/auth/client";

const MORE_ITEMS = [
  { href: "/admin/checkin", label: "Quét QR khách", icon: ScanLine },
  { href: "/admin/thu-tien", label: "Thu tiền (VietQR)", icon: QrCode },
  { href: "/admin/staff", label: "Thợ", icon: Users2 },
  { href: "/admin/schedule", label: "Lịch & cấu hình", icon: CalendarClock },
  { href: "/admin/revenue", label: "Doanh thu", icon: LineChart },
  { href: "/admin/promotions", label: "Khuyến mãi", icon: Ticket },
  { href: "/admin/packages", label: "Gói trả trước", icon: Package },
  { href: "/admin/shop", label: "Shop & QR", icon: Store },
] as const;

export function MoreMenu() {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <Sheet>
      <SheetTrigger className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground">
        <MoreHorizontal className="size-5" aria-hidden />
        Thêm
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8">
        <SheetHeader>
          <SheetTitle>Thêm</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-2 pb-2">
          {MORE_ITEMS.map(({ href, label, icon: Icon }) => (
            <SheetClose
              key={href}
              render={
                <Link
                  href={href}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-muted"
                >
                  <Icon className="size-5 text-muted-foreground" aria-hidden />
                  {label}
                </Link>
              }
            />
          ))}
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-left text-destructive hover:bg-muted"
          >
            <LogOut className="size-5" aria-hidden />
            Đăng xuất
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
