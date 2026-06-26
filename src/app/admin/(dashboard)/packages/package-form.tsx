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
import type { Package, Service } from "@/lib/db/schema";
import { createPackage, updatePackage } from "./actions";

interface PackageFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pkg?: Package | null;
  services: Service[];
}

type FormState = {
  name: string;
  price: string;
  sessions: string;
  validityDays: string;
  serviceId: string; // "" = mọi dịch vụ
  sortOrder: string;
  active: boolean;
};

function buildInitialState(pkg?: Package | null): FormState {
  return {
    name: pkg?.name ?? "",
    price: pkg?.price?.toString() ?? "0",
    sessions: pkg?.sessions?.toString() ?? "1",
    validityDays: pkg?.validityDays?.toString() ?? "30",
    serviceId: pkg?.serviceId ?? "",
    sortOrder: pkg?.sortOrder?.toString() ?? "0",
    active: pkg?.active ?? true,
  };
}

export function PackageForm({ open, onOpenChange, pkg, services }: PackageFormProps) {
  const [form, setForm] = useState<FormState>(() => buildInitialState(pkg));
  const [isPending, startTransition] = useTransition();

  const handleOpenChange = (next: boolean) => {
    if (next) setForm(buildInitialState(pkg));
    onOpenChange(next);
  };

  const set =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const input = {
      name: form.name,
      price: Number(form.price),
      sessions: Number(form.sessions),
      validityDays: Number(form.validityDays),
      serviceId: form.serviceId === "" ? null : form.serviceId,
      sortOrder: Number(form.sortOrder),
      active: form.active,
    };

    startTransition(async () => {
      const result = pkg
        ? await updatePackage(pkg.id, input)
        : await createPackage(input);

      if (result.ok) {
        toast.success(pkg ? "Đã cập nhật gói" : "Đã thêm gói");
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
          <DialogTitle>{pkg ? "Sửa gói" : "Thêm gói trả trước"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="pkg-name">Tên gói *</Label>
            <Input
              id="pkg-name"
              value={form.name}
              onChange={set("name")}
              placeholder="VD: Gói 10 buổi cắt tóc"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="pkg-price">Giá (đ) *</Label>
              <Input
                id="pkg-price"
                type="number"
                min={0}
                max={100000000}
                value={form.price}
                onChange={set("price")}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pkg-sessions">Số buổi *</Label>
              <Input
                id="pkg-sessions"
                type="number"
                min={1}
                max={1000}
                value={form.sessions}
                onChange={set("sessions")}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="pkg-validity">Hạn dùng (ngày) *</Label>
              <Input
                id="pkg-validity"
                type="number"
                min={1}
                max={3650}
                value={form.validityDays}
                onChange={set("validityDays")}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pkg-sort">Thứ tự hiển thị</Label>
              <Input
                id="pkg-sort"
                type="number"
                min={0}
                max={9999}
                value={form.sortOrder}
                onChange={set("sortOrder")}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="pkg-service">Áp dụng cho dịch vụ</Label>
            <select
              id="pkg-service"
              value={form.serviceId}
              onChange={set("serviceId")}
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Mọi dịch vụ</option>
              {services.map((svc) => (
                <option key={svc.id} value={svc.id}>
                  {svc.name}
                </option>
              ))}
            </select>
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

          <DialogFooter className="-mx-0 -mb-0 border-0 bg-transparent p-0 pt-2">
            <DialogClose
              render={
                <Button type="button" variant="outline" disabled={isPending} />
              }
            >
              Hủy
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang lưu..." : pkg ? "Lưu thay đổi" : "Thêm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
