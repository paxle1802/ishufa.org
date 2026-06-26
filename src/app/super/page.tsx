import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSuperAdmin } from "@/lib/auth/require-admin";
import { getAllShops } from "@/lib/db/queries-staff";

export default async function SuperPage() {
  await requireSuperAdmin();
  const shops = await getAllShops();

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Chọn salon</h1>
      {shops.length === 0 && (
        <p className="text-sm text-muted-foreground">Chưa có salon nào.</p>
      )}
      <div className="flex flex-col gap-2">
        {shops.map((shop) => (
          <Link key={shop.id} href={`/super/${shop.id}`}>
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span>{shop.name}</span>
                  <Badge variant={shop.active ? "default" : "outline"}>
                    {shop.active ? "Đang mở" : "Đã tắt"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-xs text-muted-foreground">/{shop.slug}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
