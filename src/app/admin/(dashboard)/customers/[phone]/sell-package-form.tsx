"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ActivePackage } from "@/lib/db/queries-customers";
import { sellPackageAction } from "../actions";

const vnd = new Intl.NumberFormat("vi-VN");

interface Props {
  customerId: string;
  packages: ActivePackage[];
}

export function SellPackageForm({ customerId, packages }: Props) {
  const [isPending, startTransition] = useTransition();

  if (packages.length === 0) return null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const packageId = data.get("packageId") as string;

    startTransition(async () => {
      const result = await sellPackageAction(customerId, packageId);
      if (result.ok) {
        toast.success("Đã bán gói thành công");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <select
        name="packageId"
        required
        disabled={isPending}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      >
        {packages.map((pkg) => (
          <option key={pkg.id} value={pkg.id}>
            {pkg.name} — {vnd.format(pkg.price)}đ ·{" "}
            {pkg.kind === "prepaid" ? "nạp tiền" : `${pkg.sessions} buổi`}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Đang xử lý…" : "Bán gói"}
      </Button>
    </form>
  );
}
