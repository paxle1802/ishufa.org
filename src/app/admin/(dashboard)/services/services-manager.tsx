"use client";

import { useState, useTransition } from "react";
import { PlusIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Service } from "@/lib/db/schema";
import { toggleServiceActive, deleteService } from "./actions";
import { ServiceForm } from "./service-form";

const fmtVnd = (amount: number) =>
  new Intl.NumberFormat("vi-VN").format(amount) + "đ";

interface ServicesManagerProps {
  services: Service[];
}

export function ServicesManager({ services: initial }: ServicesManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [isPending, startTransition] = useTransition();

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (svc: Service) => {
    setEditing(svc);
    setDialogOpen(true);
  };

  const handleToggle = (svc: Service) => {
    startTransition(async () => {
      const result = await toggleServiceActive(svc.id);
      if (!result.ok) toast.error(result.error);
    });
  };

  const handleDelete = (svc: Service) => {
    if (!window.confirm(`Xóa dịch vụ "${svc.name}"? Hành động không thể hoàn tác.`)) return;
    startTransition(async () => {
      const result = await deleteService(svc.id);
      if (result.ok) {
        toast.success("Đã xóa dịch vụ");
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {initial.length} dịch vụ
        </p>
        <Button size="sm" onClick={openAdd}>
          <PlusIcon />
          Thêm dịch vụ
        </Button>
      </div>

      {initial.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Chưa có dịch vụ nào. Thêm dịch vụ đầu tiên để bắt đầu.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {initial.map((svc, idx) => (
            <Card key={svc.id} className={svc.active ? "" : "opacity-60"}>
              <CardContent className="py-3">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{svc.name}</span>
                      {svc.category && (
                        <Badge variant="secondary">{svc.category}</Badge>
                      )}
                      {!svc.active && (
                        <Badge variant="outline">Tắt</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {fmtVnd(svc.price)} · {svc.durationMin} phút
                    </p>
                    {svc.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {svc.description}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      title="Sửa"
                      onClick={() => openEdit(svc)}
                      disabled={isPending}
                    >
                      <PencilIcon />
                      <span className="sr-only">Sửa</span>
                    </Button>
                    <Button
                      size="sm"
                      variant={svc.active ? "outline" : "secondary"}
                      onClick={() => handleToggle(svc)}
                      disabled={isPending}
                    >
                      {svc.active ? "Tắt" : "Bật"}
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="destructive"
                      title="Xóa"
                      onClick={() => handleDelete(svc)}
                      disabled={isPending}
                    >
                      <Trash2Icon />
                      <span className="sr-only">Xóa</span>
                    </Button>
                  </div>
                </div>

                {idx < initial.length - 1 && (
                  <Separator className="mt-3" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ServiceForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        service={editing}
      />
    </>
  );
}
