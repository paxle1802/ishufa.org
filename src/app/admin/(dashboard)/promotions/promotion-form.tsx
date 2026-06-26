"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Promotion } from "@/lib/db/schema";
import { createPromotion, updatePromotion } from "./actions";

interface PromotionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotion?: Promotion | null;
}

type FormState = {
  code: string;
  discountType: "percent" | "fixed";
  value: string;
  startDate: string;
  endDate: string;
  usageLimit: string;
  active: boolean;
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildInitialState(promotion?: Promotion | null): FormState {
  return {
    code: promotion?.code ?? "",
    discountType: promotion?.discountType ?? "percent",
    value: promotion?.value?.toString() ?? "10",
    startDate: promotion?.startDate ?? today(),
    endDate: promotion?.endDate ?? today(),
    usageLimit: promotion?.usageLimit?.toString() ?? "",
    active: promotion?.active ?? true,
  };
}

export function PromotionForm({ open, onOpenChange, promotion }: PromotionFormProps) {
  const [form, setForm] = useState<FormState>(() => buildInitialState(promotion));
  const [isPending, startTransition] = useTransition();

  const handleOpenChange = (next: boolean) => {
    if (next) setForm(buildInitialState(promotion));
    onOpenChange(next);
  };

  const set =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const input = {
      code: form.code,
      discountType: form.discountType,
      value: Number(form.value),
      startDate: form.startDate,
      endDate: form.endDate,
      usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit),
      active: form.active,
    };

    startTransition(async () => {
      const result = promotion
        ? await updatePromotion(promotion.id, input)
        : await createPromotion(input);

      if (result.ok) {
        toast.success(promotion ? "Đã cập nhật khuyến mãi" : "Đã thêm khuyến mãi");
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{promotion ? "Sửa khuyến mãi" : "Thêm khuyến mãi"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="promo-code">Mã khuyến mãi *</Label>
            <Input
              id="promo-code"
              value={form.code}
              onChange={set("code")}
              placeholder="SALE50, NEWUSER..."
              className="uppercase"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="promo-type">Loại giảm *</Label>
              <select
                id="promo-type"
                value={form.discountType}
                onChange={set("discountType")}
                className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
              >
                <option value="percent">Phần trăm (%)</option>
                <option value="fixed">Số tiền (đ)</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="promo-value">
                {form.discountType === "percent" ? "Phần trăm *" : "Số tiền (đ) *"}
              </Label>
              <Input
                id="promo-value"
                type="number"
                min={1}
                max={form.discountType === "percent" ? 100 : 100000000}
                value={form.value}
                onChange={set("value")}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="promo-start">Ngày bắt đầu *</Label>
              <input
                id="promo-start"
                type="date"
                value={form.startDate}
                onChange={set("startDate")}
                required
                className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="promo-end">Ngày kết thúc *</Label>
              <input
                id="promo-end"
                type="date"
                value={form.endDate}
                onChange={set("endDate")}
                min={form.startDate}
                required
                className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="promo-limit">Giới hạn lượt dùng</Label>
              <Input
                id="promo-limit"
                type="number"
                min={1}
                value={form.usageLimit}
                onChange={set("usageLimit")}
                placeholder="Không giới hạn"
              />
            </div>
            <div className="space-y-1">
              <Label>Trạng thái</Label>
              <Button
                type="button"
                variant={form.active ? "default" : "outline"}
                className="w-full"
                onClick={() => setForm((prev) => ({ ...prev, active: !prev.active }))}
              >
                {form.active ? "Đang bật" : "Đang tắt"}
              </Button>
            </div>
          </div>

          <DialogFooter className="-mx-0 -mb-0 border-0 bg-transparent p-0 pt-2">
            <DialogClose
              render={
                <Button type="button" variant="outline" disabled={isPending} />
              }
            >
              Hủy
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang lưu..." : promotion ? "Lưu thay đổi" : "Thêm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
