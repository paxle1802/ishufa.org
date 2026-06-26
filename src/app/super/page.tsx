import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireSuperAdmin } from "@/lib/auth/require-admin";
import { getAllShops } from "@/lib/db/queries-staff";
import { formatLocal } from "@/lib/tz";

import { CreateShopForm } from "./create-shop-form";
import { ResetPasswordButton } from "./reset-password-button";

export default async function SuperPage() {
  await requireSuperAdmin();
  const shops = await getAllShops();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-base font-semibold">Salon đang dùng app</h1>
        <CreateShopForm />
      </div>

      {shops.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có salon nào.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {shops.map((shop) => (
            <Card key={shop.id} className="shadow-sm">
              <CardContent className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="font-semibold leading-tight">{shop.name}</p>
                    <Link
                      href={`/s/${shop.slug}`}
                      target="_blank"
                      className="text-xs text-primary underline-offset-2 hover:underline"
                    >
                      /s/{shop.slug}
                    </Link>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 pt-0.5 text-xs text-muted-foreground">
                      {shop.contactPhone && <span>{shop.contactPhone}</span>}
                      <span>{formatLocal(shop.createdAt, "dd/MM/yyyy")}</span>
                    </div>
                  </div>
                  <Badge variant={shop.active ? "default" : "outline"} className="shrink-0 mt-0.5">
                    {shop.active ? "Hoạt động" : "Tắt"}
                  </Badge>
                </div>
                <div className="mt-2 flex justify-end">
                  <ResetPasswordButton shopId={shop.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
