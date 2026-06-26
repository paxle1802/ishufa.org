"use client";

import {
  CalendarClock,
  LineChart,
  LogOut,
  Package,
  Scissors,
  Settings,
  Store,
  Ticket,
  Users,
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

// Icon tô màu riêng cho dễ phân biệt.
const MORE_ITEMS = [
  { href: "/admin/customers", label: "Khách", icon: Users, color: "text-sky-500" },
  { href: "/admin/services", label: "Dịch vụ", icon: Scissors, color: "text-rose-500" },
  { href: "/admin/staff", label: "Thợ", icon: Users2, color: "text-teal-500" },
  { href: "/admin/schedule", label: "Lịch & cấu hình", icon: CalendarClock, color: "text-violet-500" },
  { href: "/admin/revenue", label: "Doanh thu", icon: LineChart, color: "text-emerald-500" },
  { href: "/admin/promotions", label: "Khuyến mãi", icon: Ticket, color: "text-amber-500" },
  { href: "/admin/packages", label: "Gói trả trước", icon: Package, color: "text-fuchsia-500" },
  { href: "/admin/shop", label: "Shop & QR", icon: Store, color: "text-blue-500" },
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
      <SheetTrigger className="flex w-full flex-col items-center gap-0.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground">
        <span className="flex h-8 w-12 items-center justify-center">
          <Settings className="size-6 text-slate-500" aria-hidden />
        </span>
        Cài đặt
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8">
        <SheetHeader>
          <SheetTitle>Cài đặt</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-2 pb-2">
          {MORE_ITEMS.map(({ href, label, icon: Icon, color }) => (
            <SheetClose
              key={href}
              render={
                <Link
                  href={href}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-muted"
                >
                  <Icon className={`size-5 ${color}`} aria-hidden />
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
