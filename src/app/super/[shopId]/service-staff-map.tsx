"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Service, Staff } from "@/lib/db/schema";
import { assignServiceStaff } from "./actions";

interface Props {
  shopId: string;
  services: Service[];
  staff: Staff[];
}

export function ServiceStaffMap({ shopId, services, staff }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const activeStaff = staff.filter((s) => s.active);

  function handleChange(serviceId: string, value: string) {
    const staffId = value || null;
    startTransition(async () => {
      const res = await assignServiceStaff(shopId, serviceId, staffId);
      if (res.ok) {
        toast.success("Đã cập nhật");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gán dịch vụ cho thợ</CardTitle>
      </CardHeader>
      <CardContent>
        {services.length === 0 && (
          <p className="text-sm text-muted-foreground">Chưa có dịch vụ nào.</p>
        )}
        <ul className="divide-y divide-border/50">
          {services.map((svc) => (
            <li key={svc.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{svc.name}</p>
                {!svc.active && (
                  <span className="text-xs text-muted-foreground">Đã tắt</span>
                )}
              </div>
              <select
                value={svc.staffId ?? ""}
                onChange={(e) => handleChange(svc.id, e.target.value)}
                disabled={isPending}
                className="h-8 rounded-lg border border-input bg-card px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
              >
                <option value="">Chưa gán</option>
                {activeStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
