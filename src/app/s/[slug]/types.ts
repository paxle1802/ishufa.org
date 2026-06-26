/** Dữ liệu shop công khai truyền xuống flow đặt lịch. */
export interface PublicShop {
  slug: string;
  name: string;
  address: string | null;
  description: string | null;
  accentColor: string;
  logoUrl: string | null;
  contactPhone: string | null;
  maxAdvanceDays: number;
}

/** Dịch vụ công khai (đang bật). */
export interface PublicService {
  id: string;
  name: string;
  price: number;
  durationMin: number;
  category: string | null;
  description: string | null;
}

export interface BookingFlowProps {
  shop: PublicShop;
  services: PublicService[];
}
