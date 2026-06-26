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
import { Textarea } from "@/components/ui/textarea";
import type { Service } from "@/lib/db/schema";
import { createService, updateService } from "./actions";

interface ServiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
}

type FormState = {
  name: string;
  price: string;
  durationMin: string;
  category: string;
  description: string;
  imageUrl: string;
  sortOrder: string;
  active: boolean;
};

function buildInitialState(service?: Service | null): FormState {
  return {
    name: service?.name ?? "",
    price: service?.price?.toString() ?? "0",
    durationMin: service?.durationMin?.toString() ?? "30",
    category: service?.category ?? "",
    description: service?.description ?? "",
    imageUrl: service?.imageUrl ?? "",
    sortOrder: service?.sortOrder?.toString() ?? "0",
    active: service?.active ?? true,
  };
}

export function ServiceForm({ open, onOpenChange, service }: ServiceFormProps) {
  const [form, setForm] = useState<FormState>(() => buildInitialState(service));
  const [isPending, startTransition] = useTransition();

  // Reset form whenever the dialog opens with (possibly new) service data
  const handleOpenChange = (next: boolean) => {
    if (next) setForm(buildInitialState(service));
    onOpenChange(next);
  };

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const input = {
      name: form.name,
      price: Number(form.price),
      durationMin: Number(form.durationMin),
      category: form.category,
      description: form.description,
      imageUrl: form.imageUrl,
      sortOrder: Number(form.sortOrder),
      active: form.active,
    };

    startTransition(async () => {
      const result = service
        ? await updateService(service.id, input)
        : await createService(input);

      if (result.ok) {
        toast.success(service ? "Đã cập nhật dịch vụ" : "Đã thêm dịch vụ");
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
          <DialogTitle>{service ? "Sửa dịch vụ" : "Thêm dịch vụ"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="svc-name">Tên dịch vụ *</Label>
            <Input
              id="svc-name"
              value={form.name}
              onChange={set("name")}
              placeholder="Cắt tóc, nhuộm, uốn..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="svc-price">Giá (đ) *</Label>
              <Input
                id="svc-price"
                type="number"
                min={0}
                max={100000000}
                value={form.price}
                onChange={set("price")}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="svc-duration">Thời lượng (phút) *</Label>
              <Input
                id="svc-duration"
                type="number"
                min={5}
                max={600}
                value={form.durationMin}
                onChange={set("durationMin")}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="svc-category">Danh mục</Label>
            <Input
              id="svc-category"
              value={form.category}
              onChange={set("category")}
              placeholder="Tóc, Da mặt, Nail..."
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="svc-desc">Mô tả</Label>
            <Textarea
              id="svc-desc"
              value={form.description}
              onChange={set("description")}
              rows={3}
              placeholder="Mô tả ngắn về dịch vụ..."
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="svc-image">URL ảnh</Label>
            <Input
              id="svc-image"
              type="url"
              value={form.imageUrl}
              onChange={set("imageUrl")}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="svc-sort">Thứ tự hiển thị</Label>
              <Input
                id="svc-sort"
                type="number"
                min={0}
                max={9999}
                value={form.sortOrder}
                onChange={set("sortOrder")}
              />
            </div>
            <div className="space-y-1">
              <Label>Trạng thái</Label>
              <Button
                type="button"
                variant={form.active ? "default" : "outline"}
                className="w-full"
                onClick={() =>
                  setForm((prev) => ({ ...prev, active: !prev.active }))
                }
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
              {isPending ? "Đang lưu..." : service ? "Lưu thay đổi" : "Thêm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
