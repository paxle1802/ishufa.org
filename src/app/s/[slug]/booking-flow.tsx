"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { normalizePhone } from "@/lib/validation/booking";
import { getSlotsAction, createBookingAction } from "./actions";
import type { BookingSummary } from "./actions";
import type { BookingFlowProps } from "./types";
import { ServicePicker } from "./service-picker";
import { DateStrip } from "./date-strip";
import { SlotGrid } from "./slot-grid";
import { CustomerForm } from "./customer-form";
import { SummaryBar } from "./summary-bar";
import { BookingSuccess } from "./booking-success";

function todayVn(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Saigon" }).format(new Date());
}

export function BookingFlow({ shop, services }: BookingFlowProps) {
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [date, setDate] = useState<string>(todayVn);
  const [slots, setSlots] = useState<string[]>([]);
  const [totalDurationMin, setTotalDurationMin] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<BookingSummary | null>(null);

  // Latest-wins guard: track a counter so stale responses are ignored
  const reqIdRef = useRef(0);

  // Tự điền tên + SĐT từ lần đặt trước trên thiết bị này (khách quen khỏi gõ lại).
  useEffect(() => {
    try {
      const saved = localStorage.getItem("shufa-customer");
      if (saved) {
        const c = JSON.parse(saved) as { name?: string; phone?: string };
        if (c.name) setName(c.name);
        if (c.phone) setPhone(normalizePhone(c.phone));
      }
    } catch {
      /* localStorage không khả dụng (private mode) */
    }
  }, []);

  useEffect(() => {
    if (selectedServiceIds.length === 0) {
      setSlots([]);
      setTotalDurationMin(0);
      setTotalPrice(0);
      setSelectedSlot(null);
      return;
    }

    const myId = ++reqIdRef.current;
    setSlotsLoading(true);

    getSlotsAction({ slug: shop.slug, date, serviceIds: selectedServiceIds })
      .then((result) => {
        if (myId !== reqIdRef.current) return; // stale — discard
        if (!result.ok) {
          toast.error(result.error);
          setSlots([]);
          setTotalDurationMin(0);
          setTotalPrice(0);
          setSelectedSlot(null);
          return;
        }
        setSlots(result.slots);
        setTotalDurationMin(result.totalDurationMin);
        setTotalPrice(result.totalPrice);
        // Reset selected slot if it no longer appears in new slots
        setSelectedSlot((prev) =>
          prev && result.slots.includes(prev) ? prev : null
        );
      })
      .catch(() => {
        if (myId !== reqIdRef.current) return;
        toast.error("Không thể tải khung giờ, vui lòng thử lại.");
        setSlots([]);
      })
      .finally(() => {
        if (myId !== reqIdRef.current) return;
        setSlotsLoading(false);
      });
  }, [selectedServiceIds, date, shop.slug]);

  function toggleService(id: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleFieldChange(
    field: "name" | "phone" | "note" | "promoCode",
    value: string,
  ) {
    if (field === "name") setName(value);
    else if (field === "phone") setPhone(value);
    else if (field === "note") setNote(value);
    else setPromoCode(value);
  }

  const canBook =
    selectedServiceIds.length > 0 &&
    selectedSlot !== null &&
    name.trim().length > 0 &&
    phone.trim().length > 0;

  async function handleBook() {
    if (!canBook || !selectedSlot) return;
    setSubmitting(true);
    try {
      const result = await createBookingAction({
        slug: shop.slug,
        serviceIds: selectedServiceIds,
        startAt: selectedSlot,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        note: note.trim() || undefined,
        promoCode: promoCode.trim() || undefined,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      // Nhớ tên + SĐT cho lần đặt sau trên thiết bị này.
      try {
        localStorage.setItem(
          "shufa-customer",
          JSON.stringify({ name: name.trim(), phone: normalizePhone(phone.trim()) }),
        );
      } catch {
        /* bỏ qua */
      }
      setSuccess(result.booking);
    } catch {
      toast.error("Đặt lịch thất bại, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  // Show success screen instead of flow
  if (success) {
    return <BookingSuccess booking={success} shop={shop} />;
  }

  return (
    <div className="mx-auto w-full max-w-md pb-28">
      {/* Shop header — thẻ feature AURA nền than chì, chữ trắng + nhấn vàng */}
      <header className="px-4 pt-5">
        <div className="relative overflow-hidden rounded-3xl bg-primary p-6 text-white shadow-lg">
          {shop.logoUrl && (
            <img
              src={shop.logoUrl}
              alt={`Logo ${shop.name}`}
              className="mb-4 h-12 w-12 rounded-2xl object-cover ring-2 ring-white/30"
            />
          )}
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">
            Đặt lịch tại
          </p>
          <h1 className="font-heading mt-2 text-3xl font-semibold leading-tight">
            {shop.name}
          </h1>
          {shop.address && (
            <p className="mt-2 text-sm text-white/70">{shop.address}</p>
          )}
          {shop.description && (
            <p className="mt-2 text-sm leading-relaxed text-white/65">
              {shop.description}
            </p>
          )}
        </div>
      </header>

      {/* Thông báo lưu ý cho khách ngay khi vào trang */}
      <div className="px-4 pt-3">
        <div className="rounded-2xl border border-border bg-secondary p-4 text-sm leading-relaxed">
          <p className="font-semibold text-accent">
            Vui lòng có mặt trước giờ hẹn ít nhất 5 phút.
          </p>
          <p className="mt-0.5 text-muted-foreground">
            Lịch hẹn sẽ tự huỷ nếu bạn đến muộn quá 10 phút so với giờ đặt.
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-6">
        <ServicePicker
          services={services}
          selectedIds={selectedServiceIds}
          onToggle={toggleService}
        />

        <DateStrip
          selected={date}
          maxAdvanceDays={shop.maxAdvanceDays}
          onSelect={(d) => setDate(d)}
        />

        <SlotGrid
          slots={slots}
          selected={selectedSlot}
          loading={slotsLoading}
          onSelect={(s) => setSelectedSlot(s)}
        />

        <CustomerForm
          name={name}
          phone={phone}
          note={note}
          promoCode={promoCode}
          onChange={handleFieldChange}
        />
      </div>

      <SummaryBar
        serviceCount={selectedServiceIds.length}
        totalDurationMin={totalDurationMin}
        totalPrice={totalPrice}
        canBook={canBook}
        submitting={submitting}
        onBook={handleBook}
      />
    </div>
  );
}
