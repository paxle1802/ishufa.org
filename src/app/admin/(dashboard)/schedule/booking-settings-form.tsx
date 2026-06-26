"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Shop } from "@/lib/db/schema";
import { saveSettings } from "./actions";

interface Props {
  shop: Pick<
    Shop,
    | "slotIntervalMin"
    | "capacity"
    | "maxAdvanceDays"
    | "minLeadMin"
    | "cancelCutoffMin"
    | "gracePeriodMin"
    | "loyaltyEarnRate"
  >;
}

const FIELDS = [
  { key: "slotIntervalMin", label: "Bước slot (phút)", min: 5, max: 120 },
  { key: "capacity", label: "Số thợ (phục vụ đồng thời)", min: 1, max: 50 },
  { key: "maxAdvanceDays", label: "Đặt trước tối đa (ngày)", min: 1, max: 365 },
  { key: "minLeadMin", label: "Đặt sớm tối thiểu (phút)", min: 0, max: 1440 },
  { key: "cancelCutoffMin", label: "Hạn huỷ trước (phút)", min: 0, max: 1440 },
  { key: "gracePeriodMin", label: "Thời gian ân hạn (phút)", min: 0, max: 120 },
  { key: "loyaltyEarnRate", label: "Tích điểm (điểm / 1.000đ, 0 = tắt)", min: 0, max: 100 },
] as const;

type SettingsKey = (typeof FIELDS)[number]["key"];
type FormValues = Record<SettingsKey, string>;

export function BookingSettingsForm({ shop }: Props) {
  const [values, setValues] = useState<FormValues>(() => ({
    slotIntervalMin: String(shop.slotIntervalMin),
    capacity: String(shop.capacity),
    maxAdvanceDays: String(shop.maxAdvanceDays),
    minLeadMin: String(shop.minLeadMin),
    cancelCutoffMin: String(shop.cancelCutoffMin),
    gracePeriodMin: String(shop.gracePeriodMin),
    loyaltyEarnRate: String(shop.loyaltyEarnRate),
  }));
  const [isPending, startTransition] = useTransition();

  function handleChange(key: SettingsKey, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    const payload: Record<string, number> = {};
    for (const { key } of FIELDS) {
      const num = Number(values[key]);
      if (!Number.isInteger(num) || isNaN(num)) {
        toast.error(`Giá trị "${key}" không hợp lệ`);
        return;
      }
      payload[key] = num;
    }

    startTransition(async () => {
      const result = await saveSettings(payload);
      if (result.ok) {
        toast.success("Đã lưu cấu hình đặt lịch");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cấu hình đặt lịch</CardTitle>
        <CardDescription>
          Điều chỉnh quy tắc slot, giới hạn đặt trước và huỷ lịch.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {FIELDS.map(({ key, label, min, max }) => (
          <div key={key} className="space-y-1">
            <Label htmlFor={key} className="text-sm">
              {label}
            </Label>
            <Input
              id={key}
              type="number"
              min={min}
              max={max}
              value={values[key]}
              onChange={(e) => handleChange(key, e.target.value)}
            />
          </div>
        ))}

        <Button onClick={handleSave} disabled={isPending} className="w-full">
          {isPending ? "Đang lưu…" : "Lưu cấu hình"}
        </Button>
      </CardContent>
    </Card>
  );
}
