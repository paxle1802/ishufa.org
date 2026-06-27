"use client";

import { useRef, useTransition, useState } from "react";
import { ImageIcon, Loader2 } from "lucide-react";
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
import { createService, updateService, uploadServiceImageAction } from "./actions";

interface ServiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
  staff: { id: string; name: string }[];
}

type FormState = {
  name: string;
  price: string;
  durationMin: string;
  category: string;
  description: string;
  imageUrl: string;
  staffId: string;
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
    staffId: service?.staffId ?? "",
    sortOrder: service?.sortOrder?.toString() ?? "0",
    active: service?.active ?? true,
  };
}

export function ServiceForm({ open, onOpenChange, service, staff }: ServiceFormProps) {
  const [form, setForm] = useState<FormState>(() => buildInitialState(service));
  const [isPending, startTransition] = useTransition();
  const [isUploading, startUploading] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    startUploading(async () => {
      const result = await uploadServiceImageAction(fd);
      if (result.ok) {
        setForm((prev) => ({ ...prev, imageUrl: result.url }));
        toast.success("Đã tải ảnh lên");
      } else {
        toast.error(result.error);
      }
    });
  };

  // Reset form whenever the dialog opens with (possibly new) service data
  const handleOpenChange = (next: boolean) => {
    if (next) setForm(buildInitialState(service));
    onOpenChange(next);
  };

  const set = (field: keyof FormState) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const input = {
      name: form.name,
      price: Number(form.price),
      durationMin: Number(form.durationMin),
      category: form.category,
      description: form.description,
      imageUrl: form.imageUrl,
      staffId: form.staffId || null,
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="svc-category">Danh mục</Label>
              <Input
                id="svc-category"
                value={form.category}
                onChange={set("category")}
                placeholder="Tóc, Da mặt..."
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="svc-staff">Thợ thực hiện</Label>
              <select
                id="svc-staff"
                value={form.staffId}
                onChange={set("staffId")}
                className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option value="">Chưa gán</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
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

          <div className="space-y-1.5">
            <Label>Ảnh minh hoạ</Label>
            <div className="flex items-center gap-3">
              {form.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.imageUrl}
                  alt="Ảnh dịch vụ"
                  className="h-16 w-16 rounded-xl object-cover ring-1 ring-foreground/10"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted ring-1 ring-foreground/10">
                  <ImageIcon className="size-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  {isUploading && <Loader2 className="animate-spin" />}
                  {isUploading ? "Đang tải lên…" : form.imageUrl ? "Đổi ảnh" : "Chọn ảnh"}
                </Button>
                {form.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, imageUrl: "" }))}
                    className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                  >
                    Xoá ảnh
                  </button>
                )}
                <span className="text-xs text-muted-foreground">PNG, JPG — tối đa 4 MB</span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFile}
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
            <Button type="submit" disabled={isPending || isUploading}>
              {isPending ? "Đang lưu..." : service ? "Lưu thay đổi" : "Thêm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
