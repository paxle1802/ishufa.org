import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getShopById } from "@/lib/db/queries";

import { CollectPayment } from "./collect-payment";

/** Màn thu tiền: nhập số tiền tuỳ ý → hiện VietQR cho khách quét. */
export default async function ThuTienPage() {
  const { shopId } = await requireAdmin();
  const shop = await getShopById(shopId);
  const configured =
    !!shop?.bankBin && !!shop.bankAccountNumber && !!shop.bankAccountName;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Thanh toán</h1>
        <p className="text-sm text-muted-foreground">
          Nhập số tiền để tạo mã VietQR cho khách chuyển khoản.
        </p>
      </div>

      {configured ? (
        <CollectPayment
          bankBin={shop!.bankBin!}
          accountNumber={shop!.bankAccountNumber!}
          accountName={shop!.bankAccountName!}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Chưa có tài khoản nhận tiền</CardTitle>
            <CardDescription>
              Khai báo ngân hàng + số tài khoản ở mục Shop &amp; QR trước khi thu tiền.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link href="/admin/shop" />} className="w-full">
              Cấu hình tài khoản
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
