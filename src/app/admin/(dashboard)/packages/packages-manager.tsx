"use client";

import { useState, useTransition } from "react";
import { PlusIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Package, Service } from "@/lib/db/schema";
import { togglePackageActive, deletePackage } from "./actions";
import { PackageForm } from "./package-form";

const fmtVnd = (amount: number) =>
  new Intl.NumberFormat("vi-VN").format(amount) + "đ";

interface PackagesManagerProps {
  packages: Package[];
  services: Service[];
}

export function PackagesManager({ packages: initial, services }: PackagesManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [isPending, startTransition] = useTransition();

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (pkg: Package) => {
    setEditing(pkg);
    setDialogOpen(true);
  };

  const handleToggle = (pkg: Package) => {
    startTransition(async () => {
      const result = await togglePackageActive(pkg.id);
      if (!result.ok) toast.error(result.error);
    });
  };

  const handleDelete = (pkg: Package) => {
    if (!window.confirm(`Xóa gói "${pkg.name}"? Hành động không thể hoàn tác.`)) return;
    startTransition(async () => {
      const result = await deletePackage(pkg.id);
      if (result.ok) {
        toast.success("Đã xóa gói");
      } else {
        toast.error(result.error);
      }
    });
  };

  const serviceMap = new Map(services.map((s) => [s.id, s.name]));

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{initial.length} gói</p>
        <Button size="sm" onClick={openAdd}>
          <PlusIcon />
          Thêm gói
        </Button>
      </div>

      {initial.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Chưa có gói nào. Thêm gói đầu tiên để bắt đầu.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {initial.map((pkg, idx) => (
            <Card key={pkg.id} className={pkg.active ? "" : "opacity-60"}>
              <CardContent className="py-3">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{pkg.name}</span>
                      <Badge variant="secondary">
                        {pkg.kind === "prepaid" ? "Nạp tiền" : "Combo"}
                      </Badge>
                      {!pkg.active && <Badge variant="outline">Tắt</Badge>}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {pkg.kind === "prepaid"
                        ? `${fmtVnd(pkg.price)} · Hạn ${pkg.validityDays} ngày`
                        : `${fmtVnd(pkg.price)} · ${pkg.sessions} buổi · Hạn ${pkg.validityDays} ngày`}
                    </p>
                    {pkg.kind === "combo" && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {pkg.serviceId
                          ? (serviceMap.get(pkg.serviceId) ?? "Dịch vụ không tồn tại")
                          : "Mọi dịch vụ"}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      title="Sửa"
                      onClick={() => openEdit(pkg)}
                      disabled={isPending}
                    >
                      <PencilIcon />
                      <span className="sr-only">Sửa</span>
                    </Button>
                    <Button
                      size="sm"
                      variant={pkg.active ? "outline" : "secondary"}
                      onClick={() => handleToggle(pkg)}
                      disabled={isPending}
                    >
                      {pkg.active ? "Tắt" : "Bật"}
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="destructive"
                      title="Xóa"
                      onClick={() => handleDelete(pkg)}
                      disabled={isPending}
                    >
                      <Trash2Icon />
                      <span className="sr-only">Xóa</span>
                    </Button>
                  </div>
                </div>

                {idx < initial.length - 1 && <Separator className="mt-3" />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PackageForm
        // Remount per target so the form always seeds from the right package
        // (programmatic open doesn't trigger the dialog's onOpenChange reset).
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        pkg={editing}
        services={services}
      />
    </>
  );
}
