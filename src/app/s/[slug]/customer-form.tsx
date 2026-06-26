"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface CustomerFormProps {
  name: string;
  phone: string;
  note: string;
  promoCode: string;
  onChange: (
    field: "name" | "phone" | "note" | "promoCode",
    value: string,
  ) => void;
}

export function CustomerForm({
  name,
  phone,
  note,
  promoCode,
  onChange,
}: CustomerFormProps) {
  return (
    <section className="px-4">
      <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
        Thông tin khách hàng
      </h2>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="customer-name">
            Họ tên <span aria-hidden="true" className="text-destructive">*</span>
          </Label>
          <Input
            id="customer-name"
            type="text"
            placeholder="Nguyễn Văn A"
            autoComplete="name"
            value={name}
            onChange={(e) => onChange("name", e.target.value)}
            required
            className="h-11"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="customer-phone">
            Số điện thoại <span aria-hidden="true" className="text-destructive">*</span>
          </Label>
          <Input
            id="customer-phone"
            type="tel"
            placeholder="0901 234 567"
            autoComplete="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => onChange("phone", e.target.value)}
            required
            className="h-11"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="customer-note">Ghi chú (tuỳ chọn)</Label>
          <Textarea
            id="customer-note"
            placeholder="Dị ứng hoá chất, yêu cầu đặc biệt..."
            value={note}
            onChange={(e) => onChange("note", e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="promo-code">Mã khuyến mãi (nếu có)</Label>
          <Input
            id="promo-code"
            placeholder="VD: SALE10"
            value={promoCode}
            autoCapitalize="characters"
            onChange={(e) => onChange("promoCode", e.target.value.toUpperCase())}
            className="h-11 uppercase"
          />
        </div>
      </div>
    </section>
  );
}
