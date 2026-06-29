import { notFound } from "next/navigation";

import { getShopBySlug } from "@/lib/db/queries";
import { listActivePackages } from "@/lib/db/queries-customers";

import { PackageBuy, type BuyablePackage } from "./package-buy";

/** Trang mua gói combo / nạp tiền online (khách chuyển khoản, salon xác nhận). */
export default async function ComboPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop || !shop.active) notFound();

  const rows = await listActivePackages(shop.id);
  const packages: BuyablePackage[] = rows.map((p) => ({
    id: p.id,
    name: p.name,
    kind: p.kind,
    price: p.price,
    sessions: p.sessions,
    validityDays: p.validityDays,
  }));

  const hasBank = Boolean(
    shop.bankBin && shop.bankAccountNumber && shop.bankAccountName,
  );

  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      <a
        href={`/s/${slug}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        ← Về trang đặt lịch
      </a>

      <h1 className="font-heading text-3xl font-semibold">Mua gói</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Combo & nạp tiền tại {shop.name}. Chuyển khoản xong salon sẽ xác nhận & kích hoạt.
      </p>

      <div className="mt-5">
        {!hasBank ? (
          <p className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
            Salon chưa hỗ trợ mua online. Vui lòng liên hệ trực tiếp.
          </p>
        ) : packages.length === 0 ? (
          <p className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
            Hiện chưa có gói nào để mua.
          </p>
        ) : (
          <PackageBuy slug={slug} packages={packages} />
        )}
      </div>
    </main>
  );
}
