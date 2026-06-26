import { requireAdmin } from "@/lib/auth/require-admin";
import { getShopById } from "@/lib/db/queries";

import { QrCard } from "./qr-card";
import { ShopBrandingForm } from "./shop-branding-form";

/**
 * Trang "Shop & QR" — thông tin salon + mã QR đặt lịch.
 * Layout & auth được xử lý bởi (dashboard)/layout.tsx.
 */
export default async function ShopPage() {
  const { shopId } = await requireAdmin();
  const shop = await getShopById(shopId);

  if (!shop) {
    // requireAdmin đã bảo đảm shopId hợp lệ; trường hợp này không xảy ra thực tế.
    throw new Error("Không tìm thấy salon");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Shop &amp; QR</h1>
        <p className="text-sm text-muted-foreground">
          Thông tin salon và mã QR cho khách đặt lịch.
        </p>
      </div>

      <ShopBrandingForm shop={shop} />

      <QrCard appUrl={appUrl} slug={shop.slug} shopName={shop.name} />
    </div>
  );
}
