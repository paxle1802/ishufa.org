import { notFound } from "next/navigation";

import { getShopBySlug, listActiveServices } from "@/lib/db/queries";
import { BookingFlow } from "./booking-flow";
import type { PublicService, PublicShop } from "./types";

/**
 * Trang khách mobile-first. SSR shop + dịch vụ. 404 nếu slug sai/inactive.
 * accentColor áp vào CSS var --accent để branding theo từng shop.
 */
export default async function PublicBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop || !shop.active) notFound();

  const rows = await listActiveServices(shop.id);

  const publicShop: PublicShop = {
    slug: shop.slug,
    name: shop.name,
    address: shop.address,
    description: shop.description,
    accentColor: shop.accentColor,
    logoUrl: shop.logoUrl,
    contactPhone: shop.contactPhone,
    maxAdvanceDays: shop.maxAdvanceDays,
  };
  const services: PublicService[] = rows.map((s) => ({
    id: s.id,
    name: s.name,
    price: s.price,
    durationMin: s.durationMin,
    category: s.category,
    description: s.description,
  }));

  return (
    <div style={{ ["--accent" as string]: publicShop.accentColor }}>
      <BookingFlow shop={publicShop} services={services} />
    </div>
  );
}
