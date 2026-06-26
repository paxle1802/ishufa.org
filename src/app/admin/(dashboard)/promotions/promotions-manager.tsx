"use client";

import { useState, useTransition } from "react";
import { PlusIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Promotion } from "@/lib/db/schema";
import { togglePromotionActive, deletePromotion } from "./actions";
import { PromotionForm } from "./promotion-form";

const fmtVnd = (amount: number) =>
  new Intl.NumberFormat("vi-VN").format(amount) + "đ";

interface PromotionsManagerProps {
  promotions: Promotion[];
}

export function PromotionsManager({ promotions: initial }: PromotionsManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [isPending, startTransition] = useTransition();

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (promo: Promotion) => {
    setEditing(promo);
    setDialogOpen(true);
  };

  const handleToggle = (promo: Promotion) => {
    startTransition(async () => {
      const result = await togglePromotionActive(promo.id);
      if (!result.ok) toast.error(result.error);
    });
  };

  const handleDelete = (promo: Promotion) => {
    if (!window.confirm(`Xóa mã "${promo.code}"? Hành động không thể hoàn tác.`)) return;
    startTransition(async () => {
      const result = await deletePromotion(promo.id);
      if (result.ok) {
        toast.success("Đã xóa khuyến mãi");
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{initial.length} khuyến mãi</p>
        <Button size="sm" onClick={openAdd}>
          <PlusIcon />
          Thêm khuyến mãi
        </Button>
      </div>

      {initial.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Chưa có khuyến mãi nào. Thêm mã giảm giá đầu tiên để bắt đầu.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {initial.map((promo) => (
            <Card key={promo.id} className={promo.active ? "" : "opacity-60"}>
              <CardContent className="py-3">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {promo.code}
                      </Badge>
                      <span className="text-sm font-medium">
                        {promo.discountType === "percent"
                          ? `Giảm ${promo.value}%`
                          : `Giảm ${fmtVnd(promo.value)}`}
                      </span>
                      {!promo.active && <Badge variant="outline">Tắt</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {promo.startDate} → {promo.endDate}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Đã dùng {promo.usedCount}/{promo.usageLimit ?? "∞"}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      title="Sửa"
                      onClick={() => openEdit(promo)}
                      disabled={isPending}
                    >
                      <PencilIcon />
                      <span className="sr-only">Sửa</span>
                    </Button>
                    <Button
                      size="sm"
                      variant={promo.active ? "outline" : "secondary"}
                      onClick={() => handleToggle(promo)}
                      disabled={isPending}
                    >
                      {promo.active ? "Tắt" : "Bật"}
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="destructive"
                      title="Xóa"
                      onClick={() => handleDelete(promo)}
                      disabled={isPending}
                    >
                      <Trash2Icon />
                      <span className="sr-only">Xóa</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PromotionForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        promotion={editing}
      />
    </>
  );
}
