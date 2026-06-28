"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { customerLogout } from "./actions";

export function CustomerLogoutButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => {
        await customerLogout();
        router.refresh();
      })}
      className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white disabled:opacity-50"
    >
      <LogOut className="size-4" aria-hidden /> Đăng xuất
    </button>
  );
}
