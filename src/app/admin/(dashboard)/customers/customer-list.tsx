"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";

import type { CustomerRow } from "@/lib/db/queries-customers";

const vnd = new Intl.NumberFormat("vi-VN");

interface Props {
  customers: CustomerRow[];
  q: string;
}

export function CustomerList({ customers, q }: Props) {
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const params = new URLSearchParams();
        if (value.trim()) params.set("q", value.trim());
        router.push(`/admin/customers?${params.toString()}`);
      }, 350);
    },
    [router],
  );

  return (
    <div className="space-y-3">
      <input
        type="search"
        defaultValue={q}
        onChange={handleSearch}
        placeholder="Tìm theo tên hoặc SĐT…"
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />

      {customers.length === 0 ? (
        <p className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
          {q ? "Không tìm thấy khách nào." : "Chưa có khách hàng nào."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {customers.map((c) => (
            <li key={c.id}>
              <a
                href={`/admin/customers/${encodeURIComponent(c.phone)}`}
                className="flex flex-col gap-0.5 rounded-xl border bg-card p-3 active:bg-muted"
              >
                <span className="font-semibold">{c.name}</span>
                <span className="text-sm text-muted-foreground">{c.phone}</span>
                <span className="mt-1 text-xs text-muted-foreground">
                  {c.visitCount} lượt&nbsp;·&nbsp;{vnd.format(c.totalSpent)}đ&nbsp;·&nbsp;
                  {c.loyaltyPoints} điểm
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
